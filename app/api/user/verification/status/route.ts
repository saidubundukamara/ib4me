import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { verificationService } from "@/services/VerificationService";

// GET /api/user/verification/status - Check if user is verified to create campaigns
export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const verificationStatus = await verificationService.isUserVerifiedForCampaigns(userId);

    return NextResponse.json(verificationStatus);
  } catch (error) {
    console.error("Failed to check verification status:", error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
