import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getAdminFromToken, createAdminAuditContext, createAdminAuditLog } from "@/lib/admin-auth-token";

const rejectPayoutSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
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

    // Get admin user from token
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = rejectPayoutSchema.parse(body);

    const auditContext = createAdminAuditContext(adminUser, request);
    
    const payout = await payoutService.rejectPayout(
      id,
      adminUser._id,
      reason
    );

    // Create audit log
    await createAdminAuditLog(
      "payout.rejected",
      "payout",
      id,
      {
        reason,
        payoutId: id,
        amount: payout.amountMinor,
        previousStatus: "in_review",
        newStatus: "rejected"
      },
      auditContext
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: "Payout rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting payout:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to reject payout",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}