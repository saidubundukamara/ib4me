import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";
import { settingService } from "@/services/SettingService";
import { ledgerEntryRepository } from "@/repositories";

/**
 * Itemised balance per owned campaign.
 *
 * Never a single netted number: a lone balance can only ever be printed, not explained,
 * and the owner cannot tell what was deducted or by whom (MONIME-FEE-MODEL.md §8.1). Every
 * deduction is named, and the rates travel with it so no UI hardcodes a percentage.
 *
 * `availableMinor` reads the campaign's live Monime account — the single source of truth
 * for withdrawable funds — and FAILS OPEN on error, deliberately softer than the payout
 * gate. An optimistic number here is harmless because the authoritative, fail-closed check
 * still runs before any money moves, whereas a page that will not render because Monime is
 * slow is a real outage (§8.6). `stale: true` marks a figure we could not confirm.
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

    const [feeSettings, withdrawalSettings] = await Promise.all([
      settingService.getFeeSettings(),
      settingService.getWithdrawalSettings(),
    ]);

    const entries = await Promise.all(
      campaigns.map(async (c) => {
        const id = String(c._id);
        const currency = c.goal?.currency ?? "SLE";
        // Resolve via the service — the rate tier comes from the OWNER's account type,
        // not from a field on the campaign.
        const campaignType = await campaignService.getCampaignType(id);
        const platformFeeBps =
          campaignType === "organization"
            ? feeSettings.processingFee.organizationBps
            : feeSettings.processingFee.individualBps;

        // What the campaign has actually been credited and has taken out.
        const netReceivedMinor = c.totals?.raisedMinor ?? 0;
        const totalWithdrawnMinor = c.withdrawals?.totalPaidMinor ?? 0;

        const base = {
          currency,
          campaignType,
          netReceivedMinor,
          totalWithdrawnMinor,
          platformFeeBps,
          payoutFeeBpsEstimate: feeSettings.payoutFeeBpsEstimate,
          monimeFeeBpsEstimate: feeSettings.monimeCollectionFeeBpsEstimate,
          minPayoutMinor: withdrawalSettings.minAmountMinor,
          thresholdEnabled: withdrawalSettings.thresholdEnabled,
        };

        let ledgerBalanceMinor: number | null = null;
        try {
          ledgerBalanceMinor = (
            await ledgerEntryRepository.getCampaignBalance(
              c._id as mongoose.Types.ObjectId
            )
          ).balance;
        } catch {
          // Reporting only — never blocks the page.
        }

        try {
          const availableMinor = await payoutService.getAvailableBalanceMinor(id);
          return [
            id,
            { ...base, availableMinor, providerBalanceMinor: availableMinor, ledgerBalanceMinor, stale: false },
          ] as const;
        } catch (err) {
          // Fail OPEN for display (§8.6). Returning 0 here — which this used to do — tells
          // an owner they have no money whenever Monime is briefly unreachable. Fall back
          // to the ledger and mark the figure stale so the UI can say so.
          console.error(`[payout] balance lookup failed for campaign ${id}:`, err);
          return [
            id,
            {
              ...base,
              availableMinor: ledgerBalanceMinor ?? Math.max(0, netReceivedMinor - totalWithdrawnMinor),
              providerBalanceMinor: null,
              ledgerBalanceMinor,
              stale: true,
            },
          ] as const;
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
