import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * Settlement, the ledger, and the two-event race.
 *
 * A replica set rather than a standalone server, because every money path runs inside a
 * transaction and MongoDB only supports those on a replica set.
 *
 * Imports are deferred until after `MONGODB_URI` is set, so the modules connect to this
 * server rather than a real one.
 */
let replSet: MongoMemoryReplSet;

let donationService: typeof import("@/services/DonationService").donationService;
let Donation: typeof import("@/models/Donation").default;
let Campaign: typeof import("@/models/Campaign").default;
let LedgerEntry: typeof import("@/models/LedgerEntry").default;
let Setting: typeof import("@/models/Setting").default;

const PLATFORM_FEE_BPS = 260;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();

  ({ donationService } = await import("@/services/DonationService"));
  Donation = (await import("@/models/Donation")).default;
  Campaign = (await import("@/models/Campaign")).default;
  LedgerEntry = (await import("@/models/LedgerEntry")).default;
  Setting = (await import("@/models/Setting")).default;

  await mongoose.connect(process.env.MONGODB_URI);

  // Create the collections up front. A multi-document transaction cannot implicitly
  // create a namespace, so the first transactional write to a not-yet-existing collection
  // fails with "Unable to acquire IX lock" rather than anything that names the real cause.
  await Promise.all(
    [Donation, Campaign, LedgerEntry, Setting].map((m) =>
      m.createCollection().catch(() => undefined)
    )
  );
  await Promise.all(
    [Donation, Campaign, LedgerEntry, Setting].map((m) =>
      m.syncIndexes().catch(() => undefined)
    )
  );
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Donation.deleteMany({}),
    Campaign.deleteMany({}),
    LedgerEntry.deleteMany({}),
    Setting.deleteMany({}),
  ]);
  await Setting.create({
    _id: "platform",
    fees: {
      processingFee: { individualBps: PLATFORM_FEE_BPS, organizationBps: 200 },
      monimeCollectionFeeBpsEstimate: 100,
      payoutFeeBpsEstimate: 100,
    },
  });
});

async function seedDonation(grossMinor = 10000) {
  const campaign = await Campaign.create({
    ownerId: new mongoose.Types.ObjectId(),
    slug: `c-${Math.random().toString(36).slice(2)}`,
    status: "active",
    goal: { amountMinor: 5_000_00, currency: "SLE" },
    totals: { raisedMinor: 0, donationCount: 0 },
  });

  const donation = await Donation.create({
    campaignId: campaign._id,
    isAnonymous: true,
    amount: { currency: "SLE", minor: grossMinor },
    totalChargedMinor: grossMinor,
    campaignReceivesMinor: grossMinor,
    provider: { name: "MONIME" },
    status: "pending",
    quote: {
      grossMinor,
      monimeFeeBpsEstimate: 100,
      monimeFeeMinorEstimate: Math.floor(grossMinor / 100),
      platformFeeBps: PLATFORM_FEE_BPS,
      platformFeeMinorEstimate: 0,
      campaignReceivesMinorEstimate: 0,
    },
  });

  return { campaign, donation };
}

/** Net ledger movement for one account type, as `in − out`. */
async function ledgerBalance(accountType: string) {
  const rows = await LedgerEntry.find({ accountType });
  return rows.reduce(
    (acc, r) => acc + (r.direction === "in" ? r.amountMinor : -r.amountMinor),
    0
  );
}

describe("applySettlement", () => {
  it("credits the campaign the NET and posts a balancing ledger", async () => {
    const { campaign, donation } = await seedDonation(10000);

    await donationService.applySettlement(String(donation._id), {
      source: "webhook_payment",
      monimeFeeMinor: 100,
      monimePaymentId: "spm-test-1",
    });

    const fresh = await Donation.findById(donation._id);
    expect(fresh!.settlement!.arrivedMinor).toBe(9900);
    expect(fresh!.settlement!.platformFeeMinor).toBe(257);
    expect(fresh!.settlement!.campaignReceivesMinor).toBe(9643);
    expect(fresh!.settlement!.monimeFeeSource).toBe("reported");
    // The mirror the rest of the codebase reads.
    expect(fresh!.campaignReceivesMinor).toBe(9643);

    const c = await Campaign.findById(campaign._id);
    expect(c!.totals!.raisedMinor).toBe(9643); // the NET, not the gross

    // receipt(10000) − processor_fee(100) = 9900 still sitting in the platform account
    expect(await ledgerBalance("platform")).toBe(9900);
    expect(await ledgerBalance("platform_revenue")).toBe(257);
  });

  it("omits zero-amount ledger lines", async () => {
    // A Le0.30 donation floors its platform fee to zero — the entry must not be written.
    const { donation } = await seedDonation(30);
    await donationService.applySettlement(String(donation._id), {
      source: "webhook_payment",
      monimeFeeMinor: 0,
      monimePaymentId: "spm-tiny",
    });

    const zeroRows = await LedgerEntry.find({ amountMinor: 0 });
    expect(zeroRows).toHaveLength(0);
    expect(await LedgerEntry.countDocuments({ refType: "platform_fee" })).toBe(0);
  });

  it("does not double-count when the same event is replayed", async () => {
    const { campaign, donation } = await seedDonation(10000);
    const args = {
      source: "webhook_payment" as const,
      monimeFeeMinor: 100,
      monimePaymentId: "spm-replay",
    };

    await donationService.applySettlement(String(donation._id), args);
    await donationService.applySettlement(String(donation._id), args);
    await donationService.applySettlement(String(donation._id), args);

    const c = await Campaign.findById(campaign._id);
    expect(c!.totals!.raisedMinor).toBe(9643);
    expect(c!.totals!.donationCount).toBe(1);
    expect(await LedgerEntry.countDocuments({ refType: "platform_receipt" })).toBe(1);
  });
});

describe("the two-event race (R6)", () => {
  /**
   * Monime fires `checkout_session.completed` (no fees) and
   * `payment.processing_completed` (fees) for a single payment, and either can arrive
   * first. Both orderings must converge on identical state.
   *
   * This is THE test. The defect it guards was: the fee-less event writing a fee of 0 and
   * clobbering the real one roughly half the time.
   */
  async function runOrdering(paymentFirst: boolean) {
    // Each ordering starts from a clean ledger, so the two runs' balances are comparable
    // rather than cumulative.
    await Promise.all([
      Donation.deleteMany({}),
      Campaign.deleteMany({}),
      LedgerEntry.deleteMany({}),
    ]);
    const { campaign, donation } = await seedDonation(10000);
    const id = String(donation._id);

    const sessionEvent = () =>
      donationService.applySettlement(id, {
        source: "webhook_session",
        monimeFeeMinor: null, // NOT REPORTED — must never be written as 0
      });
    const paymentEvent = () =>
      donationService.applySettlement(id, {
        source: "webhook_payment",
        monimeFeeMinor: 137, // deliberately NOT the configured 1%
        monimePaymentId: "spm-race",
      });

    if (paymentFirst) {
      await paymentEvent();
      await sessionEvent();
    } else {
      await sessionEvent();
      await paymentEvent();
    }

    const fresh = await Donation.findById(donation._id);
    const c = await Campaign.findById(campaign._id);
    return {
      settlement: {
        monimeFeeMinor: fresh!.settlement!.monimeFeeMinor,
        monimeFeeSource: fresh!.settlement!.monimeFeeSource,
        arrivedMinor: fresh!.settlement!.arrivedMinor,
        platformFeeMinor: fresh!.settlement!.platformFeeMinor,
        campaignReceivesMinor: fresh!.settlement!.campaignReceivesMinor,
      },
      raisedMinor: c!.totals!.raisedMinor,
      donationCount: c!.totals!.donationCount,
      platform: await ledgerBalance("platform"),
      platformRevenue: await ledgerBalance("platform_revenue"),
    };
  }

  it("converges on identical state whichever event lands first", async () => {
    const sessionFirst = await runOrdering(false);
    const paymentFirst = await runOrdering(true);

    expect(sessionFirst).toEqual(paymentFirst);

    // And the converged figures are the REPORTED ones, not the assumed 1%.
    expect(sessionFirst.settlement.monimeFeeMinor).toBe(137);
    expect(sessionFirst.settlement.monimeFeeSource).toBe("reported");
    expect(sessionFirst.settlement.arrivedMinor).toBe(9863);
    expect(sessionFirst.settlement.platformFeeMinor).toBe(256); // floor(9863*260/10000)
    expect(sessionFirst.settlement.campaignReceivesMinor).toBe(9607);
    expect(sessionFirst.raisedMinor).toBe(9607);
    expect(sessionFirst.donationCount).toBe(1);
  });

  it("the fee-less event landing second writes nothing", async () => {
    const { donation } = await seedDonation(10000);
    const id = String(donation._id);

    await donationService.applySettlement(id, {
      source: "webhook_payment",
      monimeFeeMinor: 137,
      monimePaymentId: "spm-x",
    });
    const before = await Donation.findById(donation._id);

    await donationService.applySettlement(id, {
      source: "webhook_session",
      monimeFeeMinor: null,
    });
    const after = await Donation.findById(donation._id);

    expect(after!.settlement!.monimeFeeMinor).toBe(before!.settlement!.monimeFeeMinor);
    expect(after!.settlement!.monimeFeeSource).toBe("reported");
  });
});

describe("completeWithTransfer", () => {
  it("moves exactly what was booked, and freezes the split (R14)", async () => {
    const { campaign, donation } = await seedDonation(10000);
    const id = String(donation._id);

    await donationService.applySettlement(id, {
      source: "webhook_payment",
      monimeFeeMinor: 100,
      monimePaymentId: "spm-t",
    });
    await donationService.completeWithTransfer(id, "trf-1");

    const fresh = await Donation.findById(donation._id);
    expect(fresh!.status).toBe("succeeded");
    expect(fresh!.settlement!.frozen).toBe(true);

    // The two transfer legs carry the SAME figure as the persisted split.
    const out = await LedgerEntry.findOne({ refType: "platform_transfer_out" });
    const inn = await LedgerEntry.findOne({ refType: "campaign_transfer_in" });
    expect(out!.amountMinor).toBe(9643);
    expect(inn!.amountMinor).toBe(9643);
    expect(out!.amountMinor).toBe(fresh!.settlement!.campaignReceivesMinor);

    // Platform account nets to exactly the platform fee it earned.
    expect(await ledgerBalance("platform")).toBe(257);
    expect(await ledgerBalance("campaign")).toBe(9643);

    // Completing twice must not double-post or double-credit.
    await donationService.completeWithTransfer(id, "trf-1");
    expect(await LedgerEntry.countDocuments({ refType: "campaign_transfer_in" })).toBe(1);
    const c = await Campaign.findById(campaign._id);
    expect(c!.totals!.raisedMinor).toBe(9643);
  });

  it("books a variance instead of rewriting a split whose money already moved", async () => {
    const { campaign, donation } = await seedDonation(10000);
    const id = String(donation._id);

    // Settle on an ESTIMATE, transfer, and only then learn the real fee.
    await donationService.applySettlement(id, {
      source: "webhook_session",
      monimeFeeMinor: null,
    });
    await donationService.completeWithTransfer(id, "trf-2");
    const afterTransfer = await Donation.findById(donation._id);
    const movedAmount = afterTransfer!.settlement!.campaignReceivesMinor;

    await donationService.applySettlement(id, {
      source: "webhook_payment",
      monimeFeeMinor: 137,
      monimePaymentId: "spm-late",
    });

    const fresh = await Donation.findById(donation._id);
    // The campaign's figure is untouched — the money already moved at it.
    expect(fresh!.settlement!.campaignReceivesMinor).toBe(movedAmount);
    expect(fresh!.settlement!.monimeFeeMinor).toBe(137);
    expect(fresh!.settlement!.correctedAt).toBeTruthy();

    const variance = await LedgerEntry.findOne({ refType: "platform_fee_variance" });
    expect(variance).toBeTruthy();
    expect(variance!.amountMinor).toBe(37); // 137 reported − 100 assumed

    const c = await Campaign.findById(campaign._id);
    expect(c!.totals!.raisedMinor).toBe(movedAmount);
  });
});

describe("legacy rows", () => {
  it("reads through every new path without a settlement block", async () => {
    // A pre-rework donation: no `quote`, no `settlement`, fees added on top.
    const campaign = await Campaign.create({
      ownerId: new mongoose.Types.ObjectId(),
      slug: `legacy-${Math.random().toString(36).slice(2)}`,
      status: "active",
      goal: { amountMinor: 500000, currency: "SLE" },
      totals: { raisedMinor: 0, donationCount: 0 },
    });
    const legacy = await Donation.create({
      campaignId: campaign._id,
      isAnonymous: true,
      amount: { currency: "SLE", minor: 10000 },
      totalChargedMinor: 10360,
      campaignReceivesMinor: 10000,
      donorCoversFee: true,
      fees: { baseFeeMinor: 100, processingFeeMinor: 260, totalFeeMinor: 360 },
      provider: { name: "MONIME" },
      status: "pending",
    });

    await expect(
      donationService.applySettlement(String(legacy._id), {
        source: "reconcile",
        monimeFeeMinor: null,
      })
    ).resolves.toBeTruthy();

    const fresh = await Donation.findById(legacy._id);
    expect(fresh!.settlement!.platformFeeBps).toBe(PLATFORM_FEE_BPS);
    expect(fresh!.status).toBe("payment_received");
  });
});
