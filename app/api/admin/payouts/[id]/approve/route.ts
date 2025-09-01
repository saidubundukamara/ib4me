import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getAdminFromToken, createAdminAuditContext, createAdminAuditLog } from "@/lib/admin-auth-token";

const approvePayoutSchema = z.object({
  note: z.string().optional(),
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
    const { note } = approvePayoutSchema.parse(body);

    const auditContext = createAdminAuditContext(adminUser, request);
    
    // Call service with audit context
    const payout = await payoutService.approvePayout(
      id,
      adminUser._id,
      note,
      {
        ip: auditContext.ip,
        userAgent: auditContext.userAgent
      }
    );

    // Create audit log
    await createAdminAuditLog(
      "payout.approved",
      "payout",
      id,
      {
        note,
        payoutId: id,
        amount: payout.amountMinor,
        previousStatus: "in_review",
        newStatus: "approved"
      },
      auditContext
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: "Payout approved successfully"
    });
  } catch (error) {
    console.error("Error approving payout:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to approve payout" },
      { status: 500 }
    );
  }
}