import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { campaignService } from "@/services/CampaignService";
import { verificationService } from "@/services/VerificationService";

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch campaign limits and verification status in parallel
    const [status, verificationStatus] = await Promise.all([
      campaignService.checkCampaignLimitForUser(userId),
      verificationService.isUserVerifiedForCampaigns(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        remainingSlots:
          status.maxAllowed === Infinity
            ? null
            : status.maxAllowed - status.currentCount,
        verification: {
          verified: verificationStatus.verified,
          status: verificationStatus.status,
          reason: verificationStatus.reason,
          type: verificationStatus.role === "Organization" ? "kyb" : "kyc",
        },
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
