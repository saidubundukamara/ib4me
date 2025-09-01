import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/services/CampaignService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { getAdminFromToken, createAdminAuditContext, createAdminAuditLog } from "@/lib/admin-auth-token";

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

    // Get admin user from token
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, status, verificationStatus, reason } = body;

    if (!action || !["update_status", "update_verification"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const auditContext = createAdminAuditContext(adminUser, request);
    const serviceAuditContext = {
      ip: auditContext.ip,
      userAgent: auditContext.userAgent
    };

    let updatedCampaign;

    if (action === "update_status" && status) {
      if (!["draft", "active", "paused", "completed", "archived"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updatedCampaign = await campaignService.updateCampaignStatus(
        id, 
        status, 
        adminUser._id, 
        reason,
        serviceAuditContext
      );
      
      // Create audit log
      await createAdminAuditLog(
        "campaign.status_updated",
        "campaign",
        id,
        {
          campaignId: id,
          previousStatus: updatedCampaign.previousStatus || "unknown",
          newStatus: status,
          reason
        },
        auditContext
      );
    } else if (action === "update_verification" && verificationStatus) {
      if (!["pending", "under_review", "approved", "rejected"].includes(verificationStatus)) {
        return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
      }
      updatedCampaign = await campaignService.updateVerificationStatus(
        id, 
        verificationStatus, 
        adminUser._id, 
        reason,
        serviceAuditContext
      );
      
      // Create audit log
      await createAdminAuditLog(
        "campaign.verification_updated",
        "campaign",
        id,
        {
          campaignId: id,
          previousVerificationStatus: updatedCampaign.previousVerificationStatus || "unknown",
          newVerificationStatus: verificationStatus,
          reason
        },
        auditContext
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