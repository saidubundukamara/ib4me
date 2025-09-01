import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";

const overrideThresholdSchema = z.object({
  reason: z.string().min(1, "Override reason is required"),
  adminId: z.string().min(1, "Admin ID is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid payout ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, adminId } = overrideThresholdSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 400 }
      );
    }

    // Extract audit context from request
    const auditContext = {
      ip: request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    };

    const payout = await payoutService.overrideThreshold(
      id,
      new mongoose.Types.ObjectId(adminId),
      reason,
      auditContext
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: "Threshold override applied successfully"
    });
  } catch (error) {
    console.error("Error overriding threshold:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to override threshold",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}