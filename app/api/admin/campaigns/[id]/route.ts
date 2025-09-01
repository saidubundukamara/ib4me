import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/services/CampaignService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

type RouteParams = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const body = await request.json();
    const { action, status, verificationStatus, reason } = body;

    if (!action || !["update_status", "update_verification"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let updatedCampaign;
    // TODO: Get actual admin ID from authentication system
    const adminId = new mongoose.Types.ObjectId("60a5f4e5d4f7e8c3a4b3c2d1");

    if (action === "update_status" && status) {
      if (!["draft", "active", "paused", "completed", "archived"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updatedCampaign = await campaignService.updateCampaignStatus(id, status, adminId, reason);
    } else if (action === "update_verification" && verificationStatus) {
      if (!["pending", "under_review", "approved", "rejected"].includes(verificationStatus)) {
        return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
      }
      updatedCampaign = await campaignService.updateVerificationStatus(id, verificationStatus, adminId, reason);
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}