import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getAdminFromToken, createAdminAuditContext } from "@/lib/admin-auth-token";

const overrideThresholdSchema = z.object({
  reason: z.string().min(1, "Override reason is required"),
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

    // Get admin user from token (same pattern as approve/reject routes)
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = overrideThresholdSchema.parse(body);

    const auditContext = createAdminAuditContext(adminUser, request);

    const payout = await payoutService.overrideThreshold(
      id,
      adminUser._id,
      reason,
      {
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      }
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