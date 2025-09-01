import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/services/CampaignService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { createSimpleAuditLog } from "@/lib/simple-admin-audit";

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await campaignService.getById(id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
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
    const { action, status, verificationStatus, reason } = body;

    if (!action || !["update_status", "update_verification"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const adminId = new mongoose.Types.ObjectId(session.user.id);
    const auditContext = {
      ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    };

    let updatedCampaign;

    if (action === "update_status" && status) {
      if (!["draft", "active", "paused", "completed", "archived"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updatedCampaign = await campaignService.updateCampaignStatus(
        id, 
        status, 
        adminId, 
        reason,
        auditContext
      );
      
      // Create audit log
      await createSimpleAuditLog(
        "campaign.status_updated",
        "campaign",
        id,
        {
          adminId: adminId.toString(),
          adminEmail: session.user.email,
          campaignId: id,
          previousStatus: updatedCampaign.previousStatus || "unknown",
          newStatus: status,
          reason
        },
        request
      );
    } else if (action === "update_verification" && verificationStatus) {
      if (!["pending", "under_review", "approved", "rejected"].includes(verificationStatus)) {
        return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
      }
      updatedCampaign = await campaignService.updateVerificationStatus(
        id, 
        verificationStatus, 
        adminId, 
        reason,
        auditContext
      );
      
      // Create audit log
      await createSimpleAuditLog(
        "campaign.verification_updated",
        "campaign",
        id,
        {
          adminId: adminId.toString(),
          adminEmail: session.user.email,
          campaignId: id,
          previousVerificationStatus: updatedCampaign.previousVerificationStatus || "unknown",
          newVerificationStatus: verificationStatus,
          reason
        },
        request
      );
    } else {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}