import { NextRequest, NextResponse } from "next/server";
import { campaignRepository, donationRepository, userRepository } from "../../../../../repositories";

export async function GET(request: NextRequest) {
  try {
    // Get dashboard statistics
    const [totalCampaigns, totalDonations, totalUsers, activeCampaigns] = await Promise.all([
      campaignRepository.count({}),
      donationRepository.count({}),
      userRepository.count({}),
      campaignRepository.count({ status: "active" })
    ]);

    const stats = {
      totalCampaigns,
      totalDonations,
      totalUsers,
      activeCampaigns,
      pendingCampaigns: await campaignRepository.count({ status: "pending" }),
      totalAmount: 0 // TODO: Calculate total donation amount
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Dashboard stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}