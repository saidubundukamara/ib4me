import { NextResponse } from "next/server";
import { campaignService } from "@/services/CampaignService";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();

    const analytics = await campaignService.getCampaignAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}