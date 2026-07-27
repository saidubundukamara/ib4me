import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * Tip settlement and the tip ledger.
 *
 * Same harness as `settlement.spec.ts` — a replica set, because settlement runs in a
 * transaction, and collections created up front, because a transaction cannot create a
 * namespace and the resulting error names a lock rather than the real cause.
 */
let replSet: MongoMemoryReplSet;

let tipService: typeof import("@/services/TipService").tipService;
let Tip: typeof import("@/models/Tip").default;
let LedgerEntry: typeof import("@/models/LedgerEntry").default;
let Setting: typeof import("@/models/Setting").default;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri();

  ({ tipService } = await import("@/services/TipService"));
  Tip = (await import("@/models/Tip")).default;
  LedgerEntry = (await import("@/models/LedgerEntry")).default;
  Setting = (await import("@/models/Setting")).default;

  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(
    [Tip, LedgerEntry, Setting].map((m) => m.createCollection().catch(() => undefined))
  );
  await Promise.all(
    [Tip, LedgerEntry, Setting].map((m) => m.syncIndexes().catch(() => undefined))
  );
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Tip.deleteMany({}),
    LedgerEntry.deleteMany({}),
    Setting.deleteMany({}),
  ]);
  await Setting.create({
    _id: "platform",
    fees: {
      processingFee: { individualBps: 260, organizationBps: 200 },
      monimeCollectionFeeBpsEstimate: 100,
      payoutFeeBpsEstimate: 100,
    },
  });
});

async function seedTip(grossMinor = 30000) {
  return Tip.create({
    isAnonymous: true,
    amount: { currency: "SLE", minor: grossMinor },
    provider: { name: "MONIME" },
    status: "pending",
  });
}

/** Net movement on the tip account, as `in − out`. */
async function tipLedgerBalance() {
  const rows = await LedgerEntry.find({ accountType: "platform_tips" });
  return rows.reduce(
    (acc, r) => acc + (r.direction === "in" ? r.amountMinor : -r.amountMinor),
    0
  );
}

describe("tip settlement", () => {
  it("books the gross in and Monime's cut out, netting to what arrived", async () => {
    const tip = await seedTip(30000);

    await tipService.applySettlement(String(tip._id), {
      source: "webhook_payment",
      monimeFeeMinor: 300,
      monimePaymentId: "spm-tip-1",
    });

    const fresh = await Tip.findById(tip._id);
    expect(fresh!.status).toBe("succeeded");
    expect(fresh!.settlement!.monimeFeeMinor).toBe(300);
    expect(fresh!.settlement!.monimeFeeSource).toBe("reported");
    expect(fresh!.settlement!.netMinor).toBe(29700);
    // Mirrors the admin views read.
    expect(fresh!.netAmountMinor).toBe(29700);
    expect(fresh!.fees!.paymentFeeMinor).toBe(300);

    expect(await LedgerEntry.countDocuments({ accountType: "platform_tips" })).toBe(2);
    expect(await tipLedgerBalance()).toBe(29700);
  });

  it("keeps tips out of the platform account", async () => {
    // platform_tips is a different physical Monime account. Booking tips as `platform`
    // would inflate that ledger by every tip and break both reconciliations.
    const tip = await seedTip(30000);
    await tipService.applySettlement(String(tip._id), {
      source: "webhook_payment",
      monimeFeeMinor: 300,
      monimePaymentId: "spm-iso",
    });

    expect(await LedgerEntry.countDocuments({ accountType: "platform" })).toBe(0);
    expect(await LedgerEntry.countDocuments({ accountType: "platform_revenue" })).toBe(0);
  });

  it("omits the fee leg when Monime genuinely charged nothing", async () => {
    const tip = await seedTip(30000);
    await tipService.applySettlement(String(tip._id), {
      source: "webhook_payment",
      monimeFeeMinor: 0,
      monimePaymentId: "spm-free",
    });

    expect(await LedgerEntry.countDocuments({ accountType: "platform_tips" })).toBe(1);
    expect(await tipLedgerBalance()).toBe(30000);
    const fresh = await Tip.findById(tip._id);
    expect(fresh!.settlement!.monimeFeeSource).toBe("reported");
  });

  it("does not double-count a replayed event", async () => {
    const tip = await seedTip(30000);
    const args = {
      source: "webhook_payment" as const,
      monimeFeeMinor: 300,
      monimePaymentId: "spm-replay",
    };

    await tipService.applySettlement(String(tip._id), args);
    await tipService.applySettlement(String(tip._id), args);
    await tipService.applySettlement(String(tip._id), args);

    expect(await LedgerEntry.countDocuments({ accountType: "platform_tips" })).toBe(2);
    expect(await tipLedgerBalance()).toBe(29700);
  });

  it("settles on an estimate when no fee was ever reported", async () => {
    // The regression test for the old markSucceeded, which wrote the GROSS as the net and
    // recorded no fee at all.
    const tip = await seedTip(30000);
    await tipService.applySettlement(String(tip._id), {
      source: "webhook_session",
      monimeFeeMinor: null,
    });

    const fresh = await Tip.findById(tip._id);
    expect(fresh!.settlement!.monimeFeeSource).toBe("estimated");
    expect(fresh!.settlement!.monimeFeeMinor).toBe(300); // floor(30000 * 100 / 10000)
    expect(fresh!.netAmountMinor).toBe(29700);
    expect(fresh!.netAmountMinor).not.toBe(30000);
  });

  it("floors the fallback fee per tip, not across a batch", async () => {
    const tips = await Promise.all([seedTip(150), seedTip(150), seedTip(150)]);
    for (const t of tips) {
      await tipService.applySettlement(String(t._id), {
        source: "webhook_session",
        monimeFeeMinor: null,
      });
    }
    // 3 × floor(150 × 100 / 10000) = 3 × 1 = 3, not floor(450 × 100 / 10000) = 4.
    const fees = await LedgerEntry.find({ refType: "processor_fee" });
    expect(fees.reduce((a, r) => a + r.amountMinor, 0)).toBe(3);
  });
});

describe("the tip two-event race (R6)", () => {
  /**
   * `checkout_session.completed` carries no fees; `payment.processing_completed` does.
   * Either can arrive first, and both orderings must land in the same place.
   *
   * This is the test. The old pair failed it: the session event wrote the gross as the
   * net, and the payment event then returned early because the tip was already
   * `succeeded`, so the real fee was discarded whenever the session event won.
   */
  async function runOrdering(paymentFirst: boolean) {
    await Promise.all([Tip.deleteMany({}), LedgerEntry.deleteMany({})]);
    const tip = await seedTip(30000);
    const id = String(tip._id);

    const sessionEvent = () =>
      tipService.applySettlement(id, {
        source: "webhook_session",
        monimeFeeMinor: null,
      });
    const paymentEvent = () =>
      tipService.applySettlement(id, {
        source: "webhook_payment",
        monimeFeeMinor: 250, // deliberately NOT the configured 1% (300)
        monimePaymentId: "spm-race",
      });

    if (paymentFirst) {
      await paymentEvent();
      await sessionEvent();
    } else {
      await sessionEvent();
      await paymentEvent();
    }

    const fresh = await Tip.findById(tip._id);
    return {
      monimeFeeMinor: fresh!.settlement!.monimeFeeMinor,
      monimeFeeSource: fresh!.settlement!.monimeFeeSource,
      netMinor: fresh!.settlement!.netMinor,
      netAmountMinor: fresh!.netAmountMinor,
      ledger: await tipLedgerBalance(),
    };
  }

  it("converges on identical state whichever event lands first", async () => {
    const sessionFirst = await runOrdering(false);
    const paymentFirst = await runOrdering(true);

    expect(sessionFirst).toEqual(paymentFirst);

    // And converges on the REPORTED fee, not the assumed 1%.
    expect(sessionFirst.monimeFeeMinor).toBe(250);
    expect(sessionFirst.monimeFeeSource).toBe("reported");
    expect(sessionFirst.netMinor).toBe(29750);
    expect(sessionFirst.ledger).toBe(29750);
  });

  it("the fee-less event landing second writes nothing", async () => {
    const tip = await seedTip(30000);
    const id = String(tip._id);

    await tipService.applySettlement(id, {
      source: "webhook_payment",
      monimeFeeMinor: 250,
      monimePaymentId: "spm-x",
    });
    const before = await Tip.findById(tip._id);

    await tipService.applySettlement(id, {
      source: "webhook_session",
      monimeFeeMinor: null,
    });
    const after = await Tip.findById(tip._id);

    expect(after!.settlement!.monimeFeeMinor).toBe(before!.settlement!.monimeFeeMinor);
    expect(after!.settlement!.monimeFeeSource).toBe("reported");
    expect(await tipLedgerBalance()).toBe(29750);
  });

  it("corrects the ledger when the reported fee differs from the estimate", async () => {
    const tip = await seedTip(30000);
    const id = String(tip._id);

    await tipService.applySettlement(id, { source: "webhook_session", monimeFeeMinor: null });
    expect(await tipLedgerBalance()).toBe(29700); // assumed 300

    await tipService.applySettlement(id, {
      source: "webhook_payment",
      monimeFeeMinor: 250,
      monimePaymentId: "spm-corr",
    });

    // 50 came back: the real fee was lower than assumed.
    expect(await tipLedgerBalance()).toBe(29750);
    const fresh = await Tip.findById(tip._id);
    expect(fresh!.settlement!.correctedAt).toBeTruthy();
    expect(fresh!.netAmountMinor).toBe(29750);
  });
});

describe("failed tips", () => {
  it("book nothing", async () => {
    const tip = await seedTip(30000);
    await tipService.markFailed(String(tip._id), "Payment failed");

    await expect(
      tipService.applySettlement(String(tip._id), {
        source: "webhook_payment",
        monimeFeeMinor: 300,
      })
    ).rejects.toThrow();

    expect(await LedgerEntry.countDocuments({})).toBe(0);
  });
});
