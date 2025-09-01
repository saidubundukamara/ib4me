import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";

const refundDonationSchema = z.object({
  reason: z.string().min(1, "Refund reason is required"),
  refundedBy: z.string().min(1, "Admin ID is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid donation ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, refundedBy } = refundDonationSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(refundedBy)) {
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const donation = await donationService.refundDonation(
      id, 
      reason, 
      new mongoose.Types.ObjectId(refundedBy)
    );

    return NextResponse.json({
      success: true,
      data: donation,
      message: "Donation refunded successfully"
    });
  } catch (error) {
    console.error("Error refunding donation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to refund donation",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}