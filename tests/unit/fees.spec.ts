import { describe, it, expect } from "vitest";
import {
  computeDonationSplit,
  computePayoutSplit,
  sumMonimeFees,
  requiredDebitMinor,
  PAYOUT_FEE_CHARGED_ON_TOP,
} from "@/lib/fees";

/**
 * The fee engine. Every test here corresponds to a defect that was real in this codebase
 * or in the reference implementation the model was extracted from — see
 * MONIME-FEE-MODEL.md §11. Treat a deleted test as a re-opened bug.
 */
describe("computeDonationSplit", () => {
  it("produces the canonical Le100 waterfall", () => {
    const s = computeDonationSplit({
      grossMinor: 10000,
      platformFeeBps: 260,
      monimeFeeMinor: 100,
    });

    expect(s.grossMinor).toBe(10000);
    expect(s.monimeFeeMinor).toBe(100);
    expect(s.arrivedMinor).toBe(9900);
    expect(s.platformFeeMinor).toBe(257); // floor(9900 * 260 / 10000) = floor(257.4)
    expect(s.campaignReceivesMinor).toBe(9643);
    expect(s.monimeFeeSource).toBe("reported");
  });

  it("keeps arrived === platformFee + campaignReceives across a wide sweep", () => {
    for (let gross = 0; gross <= 200_000; gross += 137) {
      for (const bps of [0, 1, 100, 260, 350, 500, 9999]) {
        const s = computeDonationSplit({ grossMinor: gross, platformFeeBps: bps });
        expect(s.platformFeeMinor + s.campaignReceivesMinor).toBe(s.arrivedMinor);
        expect(s.monimeFeeMinor + s.arrivedMinor).toBe(s.grossMinor);
        expect(s.campaignReceivesMinor).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(s.campaignReceivesMinor)).toBe(true);
      }
    }
  });

  it("FLOORS the platform fee rather than rounding it", () => {
    // 9900 * 255 / 10000 = 252.45 — rounding would give 253 and quietly take a minor
    // unit out of the campaign's share on roughly half of all donations.
    const s = computeDonationSplit({
      grossMinor: 10000,
      platformFeeBps: 255,
      monimeFeeMinor: 100,
    });
    expect(s.platformFeeMinor).toBe(252);
  });

  it("floors PER DONATION, never on an aggregate", () => {
    // Three separate Le1.00 donations at 350 bps: 3 x floor(99 * 350 / 10000) = 3 x 3 = 9.
    // Summing first and flooring once would give floor(297 * 350 / 10000) = 10.
    const each = [100, 100, 100].map((g) =>
      computeDonationSplit({ grossMinor: g, platformFeeBps: 350, monimeFeeMinor: 1 })
    );
    const summed = each.reduce((acc, s) => acc + s.platformFeeMinor, 0);

    expect(each[0].platformFeeMinor).toBe(3);
    expect(summed).toBe(9);
    expect(summed).not.toBe(
      Math.floor((each.reduce((a, s) => a + s.arrivedMinor, 0) * 350) / 10000)
    );
  });

  it("caps the platform fee at what actually arrived", () => {
    const s = computeDonationSplit({
      grossMinor: 100,
      platformFeeBps: 5000,
      monimeFeeMinor: 99,
    });
    expect(s.arrivedMinor).toBe(1);
    expect(s.platformFeeMinor).toBe(0);
    expect(s.campaignReceivesMinor).toBe(1);
  });

  it("clamps a reported fee that exceeds the gross instead of going negative", () => {
    const s = computeDonationSplit({
      grossMinor: 100,
      platformFeeBps: 260,
      monimeFeeMinor: 500,
    });
    expect(s.monimeFeeMinor).toBe(100);
    expect(s.arrivedMinor).toBe(0);
    expect(s.campaignReceivesMinor).toBe(0);
  });

  it("estimates from the configured rate when no fee was reported", () => {
    const s = computeDonationSplit({ grossMinor: 10000, platformFeeBps: 260 });
    expect(s.monimeFeeMinor).toBe(100);
    expect(s.monimeFeeSource).toBe("estimated");
  });

  it("lets a REPORTED fee beat the configured rate", () => {
    // R13: the recorded fee drives the money; the configured rate is only a fallback.
    // If this ever inverts, the ledger follows an assumption while the float drains.
    const s = computeDonationSplit({
      grossMinor: 10000,
      platformFeeBps: 260,
      monimeFeeMinor: 137,
      monimeFeeBpsFallback: 100,
    });
    expect(s.monimeFeeMinor).toBe(137);
    expect(s.arrivedMinor).toBe(9863);
    expect(s.monimeFeeSource).toBe("reported");
  });

  it("treats a genuine zero fee as reported, not as missing", () => {
    const s = computeDonationSplit({
      grossMinor: 10000,
      platformFeeBps: 260,
      monimeFeeMinor: 0,
    });
    expect(s.monimeFeeMinor).toBe(0);
    expect(s.monimeFeeSource).toBe("reported");
    expect(s.arrivedMinor).toBe(10000);
  });

  it("handles a donation too small to carry a platform fee", () => {
    const s = computeDonationSplit({ grossMinor: 30, platformFeeBps: 260 });
    expect(s.platformFeeMinor).toBe(0); // omitted from the ledger entirely (R5)
    expect(s.campaignReceivesMinor).toBe(s.arrivedMinor);
  });
});

describe("sumMonimeFees", () => {
  it("returns null — NOT zero — when nothing was reported", () => {
    // The whole two-event race hinges on this. `0` means "Monime charged nothing";
    // `null` means "this event didn't tell us". Conflating them lets the fee-less
    // checkout_session event clobber the real fee about half the time (R6).
    expect(sumMonimeFees(undefined)).toBeNull();
    expect(sumMonimeFees(null)).toBeNull();
    expect(sumMonimeFees([])).toBeNull();
    expect(sumMonimeFees("nonsense")).toBeNull();
    expect(sumMonimeFees([{ code: "Base" }])).toBeNull();
    expect(sumMonimeFees({ total: NaN })).toBeNull();
  });

  it("SUMS the array and never just reads the first entry", () => {
    // "Base" is the only code observed so far, but the set is Monime's to extend.
    expect(
      sumMonimeFees([
        { amount: { currency: "SLE", value: 300 } },
        { amount: { currency: "SLE", value: 45 } },
      ])
    ).toBe(345);
    expect(sumMonimeFees([{ amount: { currency: "SLE", value: 300 } }])).toBe(300);
  });

  it("still understands the legacy { total, breakdown } object", () => {
    expect(sumMonimeFees({ total: 300, breakdown: { Base: 300 } })).toBe(300);
  });

  it("reports a genuine zero as zero", () => {
    expect(sumMonimeFees([{ amount: { currency: "SLE", value: 0 } }])).toBe(0);
  });
});

describe("computePayoutSplit", () => {
  it("takes the fee out of the requested amount", () => {
    const p = computePayoutSplit({ requestedMinor: 9643, payoutFeeMinor: 96 });
    expect(p.feeMinor).toBe(96);
    expect(p.netAmountMinor).toBe(9547);
    expect(p.feeSource).toBe("reported");
  });

  it("estimates when payout.completed carried no fee", () => {
    const p = computePayoutSplit({ requestedMinor: 9643 });
    expect(p.feeMinor).toBe(96); // floor(9643 / 100)
    expect(p.feeSource).toBe("estimated");
  });

  it("never returns a negative net", () => {
    const p = computePayoutSplit({ requestedMinor: 50, payoutFeeMinor: 999 });
    expect(p.feeMinor).toBe(50);
    expect(p.netAmountMinor).toBe(0);
  });
});

describe("requiredDebitMinor", () => {
  it("requires only the requested amount while the fee is deducted-from", () => {
    // If Monime turns out to charge on top, flip PAYOUT_FEE_CHARGED_ON_TOP — this test
    // documents which side of that switch we are on.
    expect(PAYOUT_FEE_CHARGED_ON_TOP).toBe(false);
    expect(requiredDebitMinor(9643, 100)).toBe(9643);
  });
});
