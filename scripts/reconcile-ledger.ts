/**
 * Read-only ledger reconciliation.
 *
 * Compares three numbers that should agree and, until now, had no reason to:
 *
 *   1. the campaign's ledger balance   (sum of campaign_transfer_in − payout)
 *   2. its live Monime account balance (the physical truth)
 *   3. raisedMinor − totalPaidMinor    (the denormalised figure the UI has been showing)
 *
 * Any divergence matters in BOTH directions. Under means money we believe we hold is not
 * there; over means money arrived that we never booked (MONIME-FEE-MODEL.md R8).
 *
 * This writes nothing. Run it before deciding anything about the backfill — it is the
 * evidence that decision should rest on.
 *
 *   npx tsx scripts/reconcile-ledger.ts
 *   npx tsx scripts/reconcile-ledger.ts --campaign <id>
 *   npx tsx scripts/reconcile-ledger.ts --skip-provider   # ledger vs totals only, no API calls
 */
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import Campaign from "../models/Campaign";
import Donation from "../models/Donation";
import { ledgerEntryRepository } from "../repositories";
import { monimeService } from "../lib/monime";
import { settingService } from "../services/SettingService";
import { formatMinor } from "../lib/currency";

type Row = {
  campaignId: string;
  slug: string;
  currency: string;
  ledgerMinor: number;
  providerMinor: number | null;
  totalsMinor: number;
  ledgerVsProvider: number | null;
  ledgerVsTotals: number;
};

function parseArgs() {
  const argv = process.argv.slice(2);
  const campaignIdx = argv.indexOf("--campaign");
  return {
    campaignId: campaignIdx >= 0 ? argv[campaignIdx + 1] : undefined,
    skipProvider: argv.includes("--skip-provider"),
  };
}

async function main() {
  const { campaignId, skipProvider } = parseArgs();
  await connectDB();

  const filter = campaignId
    ? { _id: new mongoose.Types.ObjectId(campaignId) }
    : {};
  const campaigns = await Campaign.find(filter).lean();

  console.log(`\nReconciling ${campaigns.length} campaign(s)${skipProvider ? " (provider lookups skipped)" : ""}\n`);

  const rows: Row[] = [];

  for (const c of campaigns) {
    const id = String(c._id);
    const currency = c.goal?.currency ?? "SLE";

    const ledger = await ledgerEntryRepository.getCampaignBalance(
      c._id as mongoose.Types.ObjectId
    );
    const totalsMinor =
      (c.totals?.raisedMinor ?? 0) - (c.withdrawals?.totalPaidMinor ?? 0);

    let providerMinor: number | null = null;
    if (!skipProvider && c.financial_account?.id) {
      try {
        const account = await monimeService.getFinancialAccount(
          c.financial_account.id
        );
        providerMinor = monimeService.getAccountBalanceMinor(account);
      } catch (err) {
        console.warn(
          `  ! could not read Monime balance for ${id}: ${err instanceof Error ? err.message : err}`
        );
      }
    }

    rows.push({
      campaignId: id,
      slug: c.slug ?? "(no slug)",
      currency,
      ledgerMinor: ledger.balance,
      providerMinor,
      totalsMinor,
      ledgerVsProvider: providerMinor === null ? null : ledger.balance - providerMinor,
      ledgerVsTotals: ledger.balance - totalsMinor,
    });
  }

  const diverging = rows.filter(
    (r) => r.ledgerVsTotals !== 0 || (r.ledgerVsProvider ?? 0) !== 0
  );

  for (const r of diverging) {
    console.log(`campaign ${r.slug} (${r.campaignId})`);
    console.log(`  ledger            ${formatMinor(r.ledgerMinor, r.currency)}`);
    console.log(
      `  monime            ${r.providerMinor === null ? "(unavailable)" : formatMinor(r.providerMinor, r.currency)}`
    );
    console.log(`  raised − paid     ${formatMinor(r.totalsMinor, r.currency)}`);
    if (r.ledgerVsProvider !== null && r.ledgerVsProvider !== 0) {
      const dir = r.ledgerVsProvider > 0 ? "PROVIDER SHORT" : "PROVIDER OVER";
      console.log(
        `  ${dir}: ledger − monime = ${formatMinor(r.ledgerVsProvider, r.currency)}`
      );
    }
    if (r.ledgerVsTotals !== 0) {
      console.log(
        `  ledger − totals = ${formatMinor(r.ledgerVsTotals, r.currency)}`
      );
    }
    console.log("");
  }

  // ---- Platform-level ----
  const platform = await ledgerEntryRepository.getPlatformBalance();
  const platformAccount = await settingService.getPlatformAccountSettings();
  let platformProvider: number | null = null;
  if (!skipProvider && platformAccount?.id) {
    try {
      const account = await monimeService.getFinancialAccount(platformAccount.id);
      platformProvider = monimeService.getAccountBalanceMinor(account);
    } catch {
      /* reporting only */
    }
  }

  // ---- Fee-data coverage: how much of the history has a REAL Monime fee? ----
  const [settledTotal, reportedFee, estimatedFee, noSettlement] = await Promise.all([
    Donation.countDocuments({ status: { $in: ["succeeded", "payment_received"] } }),
    Donation.countDocuments({ "settlement.monimeFeeSource": "reported" }),
    Donation.countDocuments({ "settlement.monimeFeeSource": "estimated" }),
    Donation.countDocuments({
      status: { $in: ["succeeded", "payment_received"] },
      "settlement.appliedAt": { $exists: false },
    }),
  ]);

  console.log("─".repeat(72));
  console.log(`Campaigns checked        ${rows.length}`);
  console.log(`Campaigns diverging      ${diverging.length}`);
  console.log("");
  console.log(`Platform ledger balance  ${formatMinor(platform.balance)}`);
  console.log(
    `Platform Monime balance  ${platformProvider === null ? "(unavailable)" : formatMinor(platformProvider)}`
  );
  if (platformProvider !== null) {
    console.log(
      `Platform divergence      ${formatMinor(platform.balance - platformProvider)}`
    );
  }
  console.log("");
  console.log("Fee-data coverage (drives what a backfill can honestly reconstruct):");
  console.log(`  settled donations      ${settledTotal}`);
  console.log(`  with a REPORTED fee    ${reportedFee}`);
  console.log(`  with an ESTIMATED fee  ${estimatedFee}`);
  console.log(`  with no settlement     ${noSettlement}`);
  if (reportedFee === 0 && settledTotal > 0) {
    console.log("");
    console.log(
      "  ! No donation carries a fee Monime actually reported. Either the fee-bearing\n" +
        "    webhook has never fired, or its payload was never parsed. Any backfill can\n" +
        "    only reconstruct fees from the configured rate — label those figures as\n" +
        "    estimates and never present them as recorded (R12)."
    );
  }
  console.log("─".repeat(72));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
