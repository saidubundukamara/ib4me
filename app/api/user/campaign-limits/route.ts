import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { campaignService } from "@/services/CampaignService";

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const status = await campaignService.checkCampaignLimitForUser(userId);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        remainingSlots:
          status.maxAllowed === Infinity
            ? null
            : status.maxAllowed - status.currentCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch campaign limits:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign limits" },
      { status: 500 }
    );
  }
}
