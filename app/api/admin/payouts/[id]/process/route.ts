import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getAdminFromToken } from "@/lib/admin-auth-token";

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

    const payout = await payoutService.processPayout(
      id,
      adminUser._id
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: "Payout processing initiated successfully"
    });
  } catch (error) {
    console.error("Error processing payout:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    // Check if it's a withdrawal blocked error
    if (error instanceof Error && error.message.includes("Withdrawals are")) {
      return NextResponse.json(
        {
          error: "Withdrawals blocked",
          message: error.message
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process payout",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}