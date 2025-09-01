import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";

const addProofSchema = z.object({
  proofUrl: z.string().url("Invalid proof URL"),
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
    const { proofUrl, adminId } = addProofSchema.parse(body);

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 400 }
      );
    }

    const payout = await payoutService.addPaymentProof(
      id,
      proofUrl,
      new mongoose.Types.ObjectId(adminId)
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: "Payment proof added successfully"
    });
  } catch (error) {
    console.error("Error adding payment proof:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to add payment proof",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}