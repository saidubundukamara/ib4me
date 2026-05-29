/**
 * Reconcile donations stuck in `pending` against Monime's authoritative checkout
 * session state. Recovers donations whose webhook was missed — common for
 * mobile-money / USSD donors who never return to the browser, so the
 * /success and /[id]/status advancement paths never fire either.
 *
 * Usage:
 *   npm run reconcile:donations -- --dry-run <donationId> [<donationId> ...]
 *   npm run reconcile:donations -- --dry-run --all
 *   npm run reconcile:donations -- <donationId> [<donationId> ...]   # apply
 *   npm run reconcile:donations -- --all --apply                      # apply on all stuck pending
 *
 * Flags:
 *   --dry-run               Report planned actions without writing.
 *   --apply                 Required to actually write when using --all.
 *   --all                   Discover all pending donations older than --max-age-minutes.
 *   --max-age-minutes <n>   Default 10. How old a pending donation must be before we touch it.
 *
 * The script intentionally uses the Donation/Campaign models and the Monime client
 * directly (not the full services layer) to avoid the next-auth → @auth/mongodb-adapter
 * import chain, which doesn't load under Node 25's strict ESM resolver.
 *
 * It advances each donation to `payment_received` and increments `campaign.totals` —
 * the user-visible "not reflected" fix. The remaining `payment_received → succeeded`
 * step (internal transfer + ledger entries) is left for the webhook or the admin
 * retry-transfer route, which already handle that path correctly.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// `lib/db` reads MONGODB_URI at module load time, so it must be imported AFTER
// dotenv has populated process.env. Other modules that read env at load time
// (e.g. `lib/monime`'s MonimeService.createService) get the same treatment.
// Use dynamic imports inside main() rather than top-level static imports.
import mongoose from "mongoose";
import type { IDonation } from "../models/Donation";

interface ParsedArgs {
  dryRun: boolean;
  apply: boolean;
  all: boolean;
  maxAgeMinutes: number;
  ids: string[];
}

type Action =
  | "advanced_to_payment_received"
  | "marked_failed"
  | "skipped_no_session"
  | "skipped_not_pending"
  | "skipped_session_pending"
  | "skipped_dry_run";

interface ReconcileResult {
  donationId: string;
  action: Action;
  fromStatus: string;
  toStatus: string;
  monimeSessionStatus?: string;
  reason?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    dryRun: false,
    apply: false,
    all: false,
    maxAgeMinutes: 10,
    ids: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--apply") args.apply = true;
    else if (a === "--all") args.all = true;
    else if (a === "--max-age-minutes") {
      const next = argv[++i];
      const n = Number(next);
      if (!Number.isFinite(n) || n < 0) {
        throw new Error(`--max-age-minutes expects a non-negative number, got ${next}`);
      }
      args.maxAgeMinutes = n;
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      args.ids.push(a);
    }
  }
  return args;
}

function formatResult(r: ReconcileResult): string {
  const monime = r.monimeSessionStatus ? ` monime=${r.monimeSessionStatus}` : "";
  const reason = r.reason ? ` — ${r.reason}` : "";
  return `  ${r.donationId}  ${r.fromStatus} → ${r.toStatus}  [${r.action}]${monime}${reason}`;
}

// Loaded once inside main() after dotenv has run.
let Donation: typeof import("../models/Donation").default;
let Campaign: typeof import("../models/Campaign").default;
let monimeService: typeof import("../lib/monime").monimeService;

async function reconcileOne(donationId: string, dryRun: boolean): Promise<ReconcileResult> {
  const donation = (await Donation.findById(donationId)) as IDonation | null;
  if (!donation) throw new Error(`donation ${donationId} not found`);

  if (donation.status !== "pending") {
    return {
      donationId,
      action: "skipped_not_pending",
      fromStatus: donation.status,
      toStatus: donation.status,
      reason: `donation is ${donation.status}`,
    };
  }

  const checkoutSessionId = donation.provider?.checkoutSessionId;
  if (!checkoutSessionId) {
    return {
      donationId,
      action: "skipped_no_session",
      fromStatus: "pending",
      toStatus: "pending",
      reason: "no checkout session id",
    };
  }

  const session = await monimeService.getCheckoutSession(checkoutSessionId);
  const sessionStatus = session.result?.status;

  if (sessionStatus === "failed" || sessionStatus === "cancelled" || sessionStatus === "expired") {
    if (dryRun) {
      return {
        donationId,
        action: "skipped_dry_run",
        fromStatus: "pending",
        toStatus: "failed",
        monimeSessionStatus: sessionStatus,
        reason: `would mark failed (Monime: ${sessionStatus})`,
      };
    }
    await Donation.updateOne(
      { _id: donation._id },
      {
        $set: {
          status: "failed",
          failureReason: `Reconciliation: Monime reported ${sessionStatus}`,
          updatedAt: new Date(),
        },
      }
    );
    return {
      donationId,
      action: "marked_failed",
      fromStatus: "pending",
      toStatus: "failed",
      monimeSessionStatus: sessionStatus,
    };
  }

  if (sessionStatus !== "completed") {
    return {
      donationId,
      action: "skipped_session_pending",
      fromStatus: "pending",
      toStatus: "pending",
      monimeSessionStatus: sessionStatus,
      reason: `Monime session not completed (${sessionStatus ?? "unknown"})`,
    };
  }

  if (dryRun) {
    return {
      donationId,
      action: "skipped_dry_run",
      fromStatus: "pending",
      toStatus: "payment_received",
      monimeSessionStatus: sessionStatus,
      reason: "would mark payment_received and increment campaign totals",
    };
  }

  // Mirror DonationService.markPaymentReceived: advance status + increment campaign totals.
  // We deliberately skip the internal transfer step here — the webhook or admin
  // retry-transfer route will finalize payment_received → succeeded.
  const campaignReceivesAmount = donation.campaignReceivesMinor ?? donation.amount.minor;

  const txnSession = await mongoose.startSession();
  try {
    await txnSession.withTransaction(async () => {
      await Donation.updateOne(
        { _id: donation._id, status: "pending" },
        {
          $set: {
            status: "payment_received",
            "provider.paymentId": session.result.id,
            updatedAt: new Date(),
          },
        },
        { session: txnSession }
      );

      await Campaign.updateOne(
        { _id: donation.campaignId },
        {
          $inc: {
            "totals.raisedMinor": campaignReceivesAmount,
            "totals.donationCount": 1,
          },
          $set: { "totals.lastDonationAt": new Date() },
        },
        { session: txnSession }
      );
    });
  } finally {
    await txnSession.endSession();
  }

  return {
    donationId,
    action: "advanced_to_payment_received",
    fromStatus: "pending",
    toStatus: "payment_received",
    monimeSessionStatus: sessionStatus,
    reason: "totals incremented; transfer will finalize via webhook or admin retry",
  };
}

async function findStuckPending(maxAgeMinutes: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const docs = await Donation.find(
    {
      status: "pending",
      "provider.checkoutSessionId": { $exists: true, $ne: null },
      createdAt: { $lt: cutoff },
    },
    { _id: 1 }
  ).sort({ createdAt: 1 });
  return docs.map((d) => String(d._id));
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.all && args.ids.length === 0) {
    console.error("Usage: npm run reconcile:donations -- [--dry-run] [--all | <donationId> ...]");
    return 2;
  }

  // --all without --apply defaults to dry-run for safety. Explicit IDs apply by
  // default (the caller named them specifically), unless --dry-run is set.
  const dryRun = args.dryRun || (args.all && !args.apply);

  console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}`);
  console.log(`Source: ${args.all ? `--all (older than ${args.maxAgeMinutes} min)` : `${args.ids.length} explicit id(s)`}`);
  console.log("");

  console.log("Connecting to MongoDB...");
  const { connectDB } = await import("../lib/db");
  Donation = (await import("../models/Donation")).default;
  Campaign = (await import("../models/Campaign")).default;
  monimeService = (await import("../lib/monime")).monimeService;
  await connectDB();
  console.log(`Connected (db: ${mongoose.connection.db?.databaseName ?? "unknown"})\n`);

  let ids: string[];
  if (args.all) {
    ids = await findStuckPending(args.maxAgeMinutes);
    console.log(`Discovered ${ids.length} pending donation(s) needing reconciliation.\n`);
  } else {
    for (const id of args.ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid donation id: ${id}`);
      }
    }
    ids = args.ids;
  }

  const results: ReconcileResult[] = [];
  const errors: Array<{ donationId: string; error: string }> = [];

  for (const id of ids) {
    try {
      const r = await reconcileOne(id, dryRun);
      results.push(r);
      console.log(formatResult(r));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ donationId: id, error: message });
      console.error(`  ${id}  ERROR — ${message}`);
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, {});

  console.log("");
  console.log("Summary:");
  console.log(`  inspected: ${ids.length}`);
  for (const [action, count] of Object.entries(summary).sort()) {
    console.log(`  ${action}: ${count}`);
  }
  if (errors.length > 0) {
    console.log(`  errors: ${errors.length}`);
  }

  return errors.length > 0 ? 1 : 0;
}

main()
  .then(async (code) => {
    await mongoose.connection.close();
    process.exit(code);
  })
  .catch(async (err) => {
    console.error("Fatal:", err instanceof Error ? err.stack ?? err.message : err);
    try {
      await mongoose.connection.close();
    } catch {
      // ignore
    }
    process.exit(1);
  });
