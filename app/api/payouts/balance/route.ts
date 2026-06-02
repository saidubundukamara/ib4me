import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";

/**
 * Live available balance per owned campaign, read from the campaign's Monime
 * financial account (the single source of truth for withdrawable funds). This
 * replaces the MongoDB raised−paid estimate, which can overstate what has
 * actually settled into the account.
 *
 * Returns: { balances: { [campaignId]: { availableMinor, currency } } }
 */
export async function GET() {
  try {
    await connectDB();
    const session: Session | null = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const ownerId = new mongoose.Types.ObjectId(session.user.id);
    const campaigns = await campaignService.listByOwner(ownerId);

    const entries = await Promise.all(
      campaigns.map(async (c) => {
        const id = String(c._id);
        const currency = c.goal?.currency ?? "SLE";
        try {
          const availableMinor = await payoutService.getAvailableBalanceMinor(id);
          return [id, { availableMinor, currency }] as const;
        } catch (err) {
          // A single account lookup failing should not break the whole page.
          console.error(`[payout] balance lookup failed for campaign ${id}:`, err);
          return [id, { availableMinor: 0, currency, error: true }] as const;
        }
      })
    );

    const balances = Object.fromEntries(entries);
    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error fetching campaign balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch balances" },
      { status: 500 }
    );
  }
}
