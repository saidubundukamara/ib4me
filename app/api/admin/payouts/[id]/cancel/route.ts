import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";

const cancelPayoutSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
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
    const { reason, adminId } = cancelPayoutSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const payout = await payoutService.cancelPayout(
      id,
      new mongoose.Types.ObjectId(adminId),
      reason
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: "Payout cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling payout:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to cancel payout",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}