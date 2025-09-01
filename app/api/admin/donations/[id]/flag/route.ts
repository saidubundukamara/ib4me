import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { createSimpleAuditLog } from "@/lib/simple-admin-audit";

const flagDonationSchema = z.object({
  reason: z.string().min(1, "Flag reason is required"),
});

const unflagDonationSchema = z.object({
  // No additional fields needed - admin context comes from session
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
    const { reason } = flagDonationSchema.parse(body);

    const adminId = new mongoose.Types.ObjectId(session.user.id);
    const auditContext = {
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    };

    const donation = await donationService.flagForReview(
      id, 
      reason, 
      adminId,
      auditContext
    );

    // Create audit log
    await createSimpleAuditLog(
      "donation.flagged_for_review",
      "donation",
      id,
      {
        adminId: adminId.toString(),
        adminEmail: session.user.email,
        donationId: id,
        flagReason: reason,
        amount: donation.amount?.minor,
        currency: donation.amount?.currency
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: donation,
      message: "Donation flagged for review successfully"
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
      { error: "Failed to flag donation" },
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

    // Parse body but don't require any fields
    await request.json();
    unflagDonationSchema.parse({});

    const adminId = new mongoose.Types.ObjectId(session.user.id);
    const auditContext = {
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    };

    const donation = await donationService.unflagDonation(
      id, 
      adminId,
      auditContext
    );

    // Create audit log
    await createSimpleAuditLog(
      "donation.unflagged",
      "donation",
      id,
      {
        adminId: adminId.toString(),
        adminEmail: session.user.email,
        donationId: id,
        amount: donation.amount?.minor,
        currency: donation.amount?.currency
      },
      request
    );

    return NextResponse.json({
      success: true,
      data: donation,
      message: "Donation unflagged successfully"
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
      { error: "Failed to unflag donation" },
      { status: 500 }
    );
  }
}