import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";

/**
 * GET /api/payouts/quote?campaignId=…&amountMinor=…
 *
 * What a withdrawal will actually pay out, for the confirmation screen.
 *
 * Mobile money providers charge a fee on every withdrawal, taken out of the amount sent —
 * so the owner receives less than they asked for. That must be stated up front rather
 * than discovered afterwards (MONIME-FEE-MODEL.md §8.7). The fee here is an estimate;
 * the exact figure is recorded on the payout when it settles.
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authConfig)) as Session | null;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const campaignId = req.nextUrl.searchParams.get("campaignId");
    const amountRaw = req.nextUrl.searchParams.get("amountMinor");
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const amountMinor = Math.max(0, Math.floor(Number(amountRaw ?? 0)));
    if (!Number.isFinite(amountMinor)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Ownership check — a quote leaks a campaign's balance, so it is not public.
    const userCampaigns = await campaignService.listByOwner(
      new mongoose.Types.ObjectId(userId)
    );
    const owns = userCampaigns.some((c) => String(c._id) === campaignId);
    if (!owns) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const quote = await payoutService.quotePayout(campaignId, amountMinor);
    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    console.error("[api/payouts/quote] error:", error);
    return NextResponse.json(
      { error: "Unable to quote this withdrawal right now." },
      { status: 500 }
    );
  }
}
