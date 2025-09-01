import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { createSimpleAuditLog } from "@/lib/simple-admin-audit";

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

    // Check authentication using existing pattern
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userRoles = session.user.roles || [];
    const hasAdminRole = userRoles.some(role => ["Admin", "SuperAdmin"].includes(role));
    if (!hasAdminRole) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note } = approvePayoutSchema.parse(body);

    const adminId = new mongoose.Types.ObjectId(session.user.id);
    
    // Call service with simplified audit context
    const payout = await payoutService.approvePayout(
      id,
      adminId,
      note,
      {
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      }
    );

    // Create audit log
    await createSimpleAuditLog(
      "payout.approved",
      "payout",
      id,
      {
        adminId: adminId.toString(),
        adminEmail: session.user.email,
        note,
        payoutId: id,
        amount: payout.amountMinor,
        previousStatus: "in_review",
        newStatus: "approved"
      },
      request
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