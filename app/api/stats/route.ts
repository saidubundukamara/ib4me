import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { campaignRepository, donationRepository, userRepository } from "@/repositories";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    await connectDB();

    const [
      totalCampaigns,
      totalDonations,
      totalDonors,
      allCampaigns,
    ] = await Promise.all([
      campaignRepository.count({ status: "active" } as never),
      donationRepository.count({ status: "completed" } as never),
      userRepository.count({} as never),
      campaignRepository.findMany({ status: "active" } as never, {
        query: { select: "totals.raisedMinor goal.currency" },
      }),
    ]);

    const totalRaisedMinor = allCampaigns.reduce(
      (sum, c) => sum + (c.totals?.raisedMinor ?? 0),
      0
    );

    return NextResponse.json({
      totalCampaigns,
      totalDonations,
      totalDonors,
      totalRaisedMinor,
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
