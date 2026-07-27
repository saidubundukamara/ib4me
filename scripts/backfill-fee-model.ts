/**
 * Backfill the settlement split onto historical donations.
 *
 * ## Read this before running it
 *
 * The obvious implementation — recompute every donation under the new waterfall — is
 * WRONG, and would quietly reduce campaign totals for money that genuinely arrived.
 *
 * Every donation taken before this rework was settled with `donorCoversFee = true` (the
 * feature flag defaulted off, which forced that mode). Those donors really did pay the
 * surcharge on top: charged `amount + fees`, with the campaign credited the full `amount`.
 * That credit is CORRECT for what happened. Re-deriving it as `gross − fees` would claw
 * back money the campaign actually received.
 *
 * So the backfill is mode-aware:
 *
 *   donorCoversFee === true   → reconstruct `settlement.*` for reporting only.
 *                               `raisedMinor` is already right; leave it alone.
 *   donorCoversFee === false  → the new waterfall applies; recompute and rebuild totals.
 *
 * ## On reconstructed fees
 *
 * Where Monime never reported a fee (likely most or all rows — run
 * `scripts/reconcile-ledger.ts` first to find out), the figure is derived from the
 * configured rate and marked `monimeFeeSource: "estimated"`. A reconstructed number must
 * never be presented as one Monime confirmed (MONIME-FEE-MODEL.md R12). Note also that a
 * polled read carries no fee data, so it cannot be fetched after the fact (§2.10).
 *
 * ## Usage
 *
 *   npx tsx scripts/backfill-fee-model.ts              # dry run (default) — writes nothing
 *   npx tsx scripts/backfill-fee-model.ts --apply      # actually write
 *   npx tsx scripts/backfill-fee-model.ts --apply --rebuild-totals
 *   npx tsx scripts/backfill-fee-model.ts --campaign <id>
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import Donation from "../models/Donation";
import Campaign from "../models/Campaign";
import { computeDonationSplit } from "../lib/fees";
import { formatMinor } from "../lib/currency";
import { settingService } from "../services/SettingService";
import { campaignService } from "../services/CampaignService";

type Mode = "donor_covered" | "fee_from_donation";

function parseArgs() {
  const argv = process.argv.slice(2);
  const ci = argv.indexOf("--campaign");
  return {
    apply: argv.includes("--apply"),
    rebuildTotals: argv.includes("--rebuild-totals"),
    campaignId: ci >= 0 ? argv[ci + 1] : undefined,
  };
}

async function main() {
  const { apply, rebuildTotals, campaignId } = parseArgs();
  await connectDB();

  if (!apply) {
    console.log("\nDRY RUN — nothing will be written. Re-run with --apply to commit.\n");
  } else {
    console.log("\n*** APPLYING CHANGES ***\n");
  }

  const feeSettings = await settingService.getFeeSettings();
  const monimeBps = feeSettings.monimeCollectionFeeBpsEstimate;

  const filter: Record<string, unknown> = {
    status: { $in: ["succeeded", "payment_received"] },
    "settlement.appliedAt": { $exists: false },
  };
  if (campaignId) filter.campaignId = new mongoose.Types.ObjectId(campaignId);

  const donations = await Donation.find(filter);
  console.log(`${donations.length} settled donation(s) without a settlement block.\n`);

  const platformBpsCache = new Map<string, number>();
  const touchedCampaigns = new Set<string>();
  const counts = { donor_covered: 0, fee_from_donation: 0, reported: 0, estimated: 0 };
  let raisedDelta = 0;

  for (const d of donations) {
    const cid = d.campaignId.toString();
    touchedCampaigns.add(cid);

    // The rate tier follows the OWNER's account type.
    if (!platformBpsCache.has(cid)) {
      const type = await campaignService.getCampaignType(cid);
      platformBpsCache.set(
        cid,
        type === "organization"
          ? feeSettings.processingFee.organizationBps
          : feeSettings.processingFee.individualBps
      );
    }
    const platformFeeBps =
      d.fees?.processingFeeBps ?? platformBpsCache.get(cid)!;

    // Prefer a fee Monime actually reported. `paymentFeeMinor` is where the old code
    // stored it — 0 there means "never recorded", not "was free", because the fee-less
    // event wrote 0 unconditionally.
    const recordedFee = d.fees?.paymentFeeMinor;
    const reportedFee = recordedFee && recordedFee > 0 ? recordedFee : null;
    if (reportedFee !== null) counts.reported++;
    else counts.estimated++;

    const mode: Mode = d.donorCoversFee === false ? "fee_from_donation" : "donor_covered";
    counts[mode]++;

    let settlement;
    let newCampaignReceives: number;

    if (mode === "donor_covered") {
      // The donor paid the surcharge. Reconstruct what actually happened rather than
      // re-deriving it: the platform collected `totalCharged`, Monime took its cut of
      // THAT (it charges on the total collected, not the item price), and the campaign
      // was correctly credited the full donation amount.
      const gross = d.totalChargedMinor ?? d.amount.minor;
      const monimeFee =
        reportedFee ?? Math.floor((gross * monimeBps) / 10000);
      const arrived = Math.max(0, gross - monimeFee);
      newCampaignReceives = d.campaignReceivesMinor ?? d.amount.minor;
      // Whatever was left over after paying the campaign is what the platform kept —
      // which is ~1% of the surcharge short of what was intended, and that shortfall is
      // exactly the leak this rework fixes.
      const platformFee = Math.max(0, arrived - newCampaignReceives);

      settlement = {
        grossMinor: gross,
        monimeFeeMinor: monimeFee,
        monimeFeeSource: reportedFee !== null ? "reported" : "estimated",
        arrivedMinor: arrived,
        platformFeeBps,
        platformFeeMinor: platformFee,
        campaignReceivesMinor: newCampaignReceives,
        appliedAt: d.completedAt ?? d.createdAt,
        frozen: true, // the money has long since moved
      };
    } else {
      const split = computeDonationSplit({
        grossMinor: d.amount.minor,
        platformFeeBps,
        monimeFeeMinor: reportedFee,
        monimeFeeBpsFallback: monimeBps,
      });
      newCampaignReceives = split.campaignReceivesMinor;
      settlement = {
        grossMinor: split.grossMinor,
        monimeFeeMinor: split.monimeFeeMinor,
        monimeFeeSource: split.monimeFeeSource,
        arrivedMinor: split.arrivedMinor,
        platformFeeBps: split.platformFeeBps,
        platformFeeMinor: split.platformFeeMinor,
        campaignReceivesMinor: split.campaignReceivesMinor,
        appliedAt: d.completedAt ?? d.createdAt,
        frozen: true,
      };
    }

    raisedDelta += newCampaignReceives - (d.campaignReceivesMinor ?? d.amount.minor);

    if (apply) {
      await Donation.updateOne(
        { _id: d._id },
        { $set: { settlement, campaignReceivesMinor: newCampaignReceives } }
      );
    }
  }

  // ---- Campaign totals ----
  //
  // Rebuilt by SUMMATION, never by incrementing — an increment applied twice is a silent
  // double-count, and this script may well be run more than once.
  const totalsReport: Array<{ slug: string; oldMinor: number; newMinor: number }> = [];
  if (rebuildTotals) {
    for (const cid of touchedCampaigns) {
      const campaign = await Campaign.findById(cid);
      if (!campaign) continue;

      const agg = await Donation.aggregate([
        {
          $match: {
            campaignId: new mongoose.Types.ObjectId(cid),
            status: { $in: ["succeeded", "payment_received"] },
          },
        },
        {
          $group: {
            _id: null,
            raisedMinor: {
              $sum: {
                $ifNull: [
                  "$settlement.campaignReceivesMinor",
                  { $ifNull: ["$campaignReceivesMinor", "$amount.minor"] },
                ],
              },
            },
            donationCount: { $sum: 1 },
          },
        },
      ]);

      const newRaised = agg[0]?.raisedMinor ?? 0;
      const newCount = agg[0]?.donationCount ?? 0;
      const oldRaised = campaign.totals?.raisedMinor ?? 0;

      if (newRaised !== oldRaised) {
        totalsReport.push({
          slug: campaign.slug ?? cid,
          oldMinor: oldRaised,
          newMinor: newRaised,
        });
      }

      if (apply) {
        await Campaign.updateOne(
          { _id: cid },
          { $set: { "totals.raisedMinor": newRaised, "totals.donationCount": newCount } }
        );
      }
    }
  }

  // ---- Report ----
  console.log("─".repeat(72));
  console.log(`Donations processed        ${donations.length}`);
  console.log(`  donor-covered (legacy)   ${counts.donor_covered}  → raisedMinor untouched`);
  console.log(`  fee-from-donation        ${counts.fee_from_donation}  → recomputed`);
  console.log(`  with a REPORTED fee      ${counts.reported}`);
  console.log(`  with an ESTIMATED fee    ${counts.estimated}`);
  console.log(`Net change to raised       ${formatMinor(raisedDelta)}`);

  if (rebuildTotals) {
    console.log(`\nCampaign totals changed    ${totalsReport.length}`);
    for (const t of totalsReport.slice(0, 25)) {
      console.log(
        `  ${t.slug}: ${formatMinor(t.oldMinor)} → ${formatMinor(t.newMinor)} ` +
          `(${formatMinor(t.newMinor - t.oldMinor)})`
      );
    }
    if (totalsReport.length > 25) {
      console.log(`  … and ${totalsReport.length - 25} more`);
    }
  } else {
    console.log("\nCampaign totals NOT rebuilt (pass --rebuild-totals to include them).");
  }

  if (counts.estimated > 0) {
    console.log(
      `\n! ${counts.estimated} donation(s) have a RECONSTRUCTED Monime fee, derived from the\n` +
        `  configured ${monimeBps} bps rather than anything Monime reported. They are marked\n` +
        `  monimeFeeSource: "estimated" — do not treat them as reconciled.`
    );
  }
  console.log("─".repeat(72));
  console.log(apply ? "\nChanges applied.\n" : "\nDry run complete — nothing written.\n");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
