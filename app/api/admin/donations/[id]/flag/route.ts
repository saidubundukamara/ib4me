import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";

const flagDonationSchema = z.object({
  reason: z.string().min(1, "Flag reason is required"),
  flaggedBy: z.string().min(1, "Admin ID is required"),
});

const unflagDonationSchema = z.object({
  unflaggedBy: z.string().min(1, "Admin ID is required"),
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
    const { reason, flaggedBy } = flagDonationSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(flaggedBy)) {
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const donation = await donationService.flagForReview(
      id, 
      reason, 
      new mongoose.Types.ObjectId(flaggedBy)
    );

    return NextResponse.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Error flagging donation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to flag donation",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { unflaggedBy } = unflagDonationSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(unflaggedBy)) {
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const donation = await donationService.unflagDonation(
      id, 
      new mongoose.Types.ObjectId(unflaggedBy)
    );

    return NextResponse.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Error unflagging donation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to unflag donation",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}