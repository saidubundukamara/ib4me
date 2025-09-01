import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import mongoose from "mongoose";
import { z } from "zod";
import { getAdminFromToken, createAdminAuditContext, createAdminAuditLog } from "@/lib/admin-auth-token";

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

    // Get admin user from token
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = flagDonationSchema.parse(body);

    const auditContext = createAdminAuditContext(adminUser, request);
    const serviceAuditContext = {
      ip: auditContext.ip,
      userAgent: auditContext.userAgent
    };

    const donation = await donationService.flagForReview(
      id, 
      reason, 
      adminUser._id,
      serviceAuditContext
    );

    // Create audit log
    await createAdminAuditLog(
      "donation.flagged_for_review",
      "donation",
      id,
      {
        donationId: id,
        flagReason: reason,
        amount: donation.amount?.minor,
        currency: donation.amount?.currency
      },
      auditContext
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

    // Get admin user from token
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin authentication required" },
        { status: 401 }
      );
    }

    // Parse body but don't require any fields
    await request.json();
    unflagDonationSchema.parse({});

    const auditContext = createAdminAuditContext(adminUser, request);
    const serviceAuditContext = {
      ip: auditContext.ip,
      userAgent: auditContext.userAgent
    };

    const donation = await donationService.unflagDonation(
      id, 
      adminUser._id,
      serviceAuditContext
    );

    // Create audit log
    await createAdminAuditLog(
      "donation.unflagged",
      "donation",
      id,
      {
        donationId: id,
        amount: donation.amount?.minor,
        currency: donation.amount?.currency
      },
      auditContext
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