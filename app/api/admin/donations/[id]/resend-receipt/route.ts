import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import mongoose from "mongoose";

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

    const success = await donationService.resendReceipt(id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Receipt resent successfully"
      });
    } else {
      return NextResponse.json(
        { error: "Failed to resend receipt" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resending receipt:", error);
    return NextResponse.json(
      { 
        error: "Failed to resend receipt",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}