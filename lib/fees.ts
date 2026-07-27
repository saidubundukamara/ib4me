/**
 * The one fee engine.
 *
 * Monime **nets its cut out of the money before it settles**. A Le1.00 donation reaches
 * the platform account as Le0.99; a payout of X moves X and the recipient's wallet gains
 * X − 1%. Nothing here "adds a fee on top" — every function models money being taken out
 * of an amount that already exists.
 *
 * The waterfall:
 *
 *     gross            donor is charged exactly this
 *       − monimeFee    RECORDED by Monime (fallback: floor(gross × collectionBps / 10000))
 *       = arrived      what the platform account physically receives
 *       − platformFee  floor(arrived × platformFeeBps / 10000)
 *       = campaignReceives
 *
 * This module is pure and dependency-free so the donate page imports the *same* function
 * the server runs. Three places used to compute a fee three ways and disagreed with each
 * other by whole Leones (MONIME-FEE-MODEL.md §8.4).
 *
 * Conventions, all load-bearing:
 *   - Integer minor units only. No floats, ever.
 *   - `Math.floor`, never `Math.round` — floored in the campaign's favour, and a quote
 *     that rounds up promises less than the campaign gets.
 *   - Floor **per donation**, never on a sum (§R3). Three Le1.00 donations at 350 bps is
 *     3 × floor(3.5) = 9, not floor(10.5) = 10.
 *   - The RECORDED fee always wins over the configured rate. The configured bps is a
 *     fallback for when the provider didn't report one, and nothing else (§R13).
 */

/** Fallback only — used when Monime did not report a collection fee. */
export const MONIME_COLLECTION_FEE_BPS_FALLBACK = 100; // 1%

/** Fallback only — used when `payout.completed` carried no fee. */
export const MONIME_PAYOUT_FEE_BPS_FALLBACK = 100; // 1%

/**
 * Whether Monime debits `amount + fee` from the source account (true) or takes the fee
 * out of the amount sent (false).
 *
 * MONIME-FEE-MODEL.md §2.8 says the fee comes out of the amount sent, which is what this
 * defaults to. Verified by funding a campaign account with exactly N and requesting a
 * payout of exactly N: if it succeeds, the fee is deducted-from and this stays `false`.
 * Flipping it is the entire change needed if that test fails — see `requiredDebitMinor`.
 */
export const PAYOUT_FEE_CHARGED_ON_TOP = false;

/**
 * Where a fee figure came from. `"reported"` means Monime told us; `"estimated"` means we
 * derived it from the configured rate and it may be wrong. Anything user-facing built on
 * an estimate must say so, and anything reconciling against Monime must treat the two
 * differently (§R12).
 */
export type FeeSource = "reported" | "estimated";

export interface DonationSplit {
  /** What the donor was charged. */
  grossMinor: number;
  /** What Monime kept before the money reached us. */
  monimeFeeMinor: number;
  /** What physically landed in the platform account: gross − monimeFee. */
  arrivedMinor: number;
  /** The platform rate actually applied, carried through for audit (§R4). */
  platformFeeBps: number;
  /** Our cut: floor(arrived × bps / 10000), capped at arrived. */
  platformFeeMinor: number;
  /** What reaches the campaign: arrived − platformFee. */
  campaignReceivesMinor: number;
  monimeFeeSource: FeeSource;
}

export interface PayoutSplit {
  /** What the campaign owner asked for — this full amount leaves their balance. */
  requestedMinor: number;
  /** What Monime keeps out of it. */
  feeMinor: number;
  /** What actually reaches the owner's wallet. */
  netAmountMinor: number;
  feeSource: FeeSource;
}

/** Monime's documented fee entry: `{ amount: { currency, value }, code, metadata }`. */
export interface MonimeFeeEntry {
  amount?: { currency?: string; value?: number } | null;
  code?: string;
  metadata?: unknown;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Clamp to a non-negative integer. Guards every boundary where bad data could enter. */
function toNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

let warnedLegacyFeeShape = false;

/**
 * Sum whatever Monime put in a `fees` field.
 *
 * Returns **`null` when nothing was reported** — never `0`. That distinction is the whole
 * reason the two-event race is fixable: Monime fires both `checkout_session.completed`
 * (no fees) and `payment.processing_completed` (fees) for one payment, either can arrive
 * first, and a handler that writes `0` for "I wasn't told" clobbers the real fee roughly
 * half the time (§R6). `null` means unknown; `0` means genuinely free.
 *
 * Tolerant of both shapes: the documented array, and the `{ total, breakdown }` object
 * that `lib/monime.ts` declared. Warns once on the legacy shape so a live payment tells
 * us which one Monime actually sends.
 *
 * Never reads `fees[0]` — the array is Monime's to extend, and `"Base"` is only the code
 * observed so far (§2.3).
 */
export function sumMonimeFees(fees: unknown): number | null {
  if (fees === null || fees === undefined) return null;

  if (Array.isArray(fees)) {
    if (fees.length === 0) return null;
    let total = 0;
    let sawAny = false;
    for (const entry of fees as MonimeFeeEntry[]) {
      const value = entry?.amount?.value;
      if (isFiniteNumber(value)) {
        total += value;
        sawAny = true;
      }
    }
    return sawAny ? toNonNegativeInt(total) : null;
  }

  if (typeof fees === "object") {
    const total = (fees as { total?: unknown }).total;
    if (isFiniteNumber(total)) {
      if (!warnedLegacyFeeShape) {
        warnedLegacyFeeShape = true;
        console.warn(
          "[fees] Monime reported fees as a { total, breakdown } object, not the " +
            "documented array. This is the shape lib/monime.ts originally assumed — " +
            "keep the tolerant parser until it is confirmed which one is real."
        );
      }
      return toNonNegativeInt(total);
    }
  }

  return null;
}

/**
 * Split a donation into what Monime took, what we take, and what the campaign gets.
 *
 * Pass `monimeFeeMinor: null` (or omit it) when the fee has not been reported — the split
 * is then an ESTIMATE and says so via `monimeFeeSource`. Never pass `0` to mean "unknown".
 */
export function computeDonationSplit(input: {
  grossMinor: number;
  platformFeeBps: number;
  monimeFeeMinor?: number | null;
  monimeFeeBpsFallback?: number;
}): DonationSplit {
  const grossMinor = toNonNegativeInt(input.grossMinor);
  const platformFeeBps = toNonNegativeInt(input.platformFeeBps);
  const fallbackBps = toNonNegativeInt(
    input.monimeFeeBpsFallback ?? MONIME_COLLECTION_FEE_BPS_FALLBACK
  );

  const reported = isFiniteNumber(input.monimeFeeMinor)
    ? toNonNegativeInt(input.monimeFeeMinor)
    : null;
  const monimeFeeSource: FeeSource = reported === null ? "estimated" : "reported";

  // A fee cannot exceed the money it is taken from — a bad or stale reported value must
  // not drive `arrived` negative.
  const monimeFeeMinor = Math.min(
    reported ?? Math.floor((grossMinor * fallbackBps) / 10000),
    grossMinor
  );

  const arrivedMinor = grossMinor - monimeFeeMinor;

  // Capped at `arrived` (§R5): a heavily-fee'd tiny donation can otherwise compute a
  // platform fee larger than the money that turned up.
  const platformFeeMinor = Math.min(
    Math.floor((arrivedMinor * platformFeeBps) / 10000),
    arrivedMinor
  );

  const campaignReceivesMinor = arrivedMinor - platformFeeMinor;

  // The identity every downstream figure depends on. If this ever trips, the ledger
  // cannot balance and a transfer is about to move money the books don't account for.
  if (arrivedMinor !== platformFeeMinor + campaignReceivesMinor) {
    throw new Error(
      `[fees] donation split does not balance: arrived=${arrivedMinor} ` +
        `platformFee=${platformFeeMinor} campaignReceives=${campaignReceivesMinor}`
    );
  }

  return {
    grossMinor,
    monimeFeeMinor,
    arrivedMinor,
    platformFeeBps,
    platformFeeMinor,
    campaignReceivesMinor,
    monimeFeeSource,
  };
}

/**
 * Split a payout into the fee Monime keeps and what the owner actually receives.
 *
 * The full `requestedMinor` leaves the campaign's balance; the fee is NOT a ledger
 * account, because it was never platform money — it comes out of a balance the campaign
 * already owned (§R7). Record it as columns on the payout instead, at completion, where
 * the figure is real rather than an estimate.
 */
export function computePayoutSplit(input: {
  requestedMinor: number;
  payoutFeeMinor?: number | null;
  payoutFeeBpsFallback?: number;
}): PayoutSplit {
  const requestedMinor = toNonNegativeInt(input.requestedMinor);
  const fallbackBps = toNonNegativeInt(
    input.payoutFeeBpsFallback ?? MONIME_PAYOUT_FEE_BPS_FALLBACK
  );

  const reported = isFiniteNumber(input.payoutFeeMinor)
    ? toNonNegativeInt(input.payoutFeeMinor)
    : null;
  const feeSource: FeeSource = reported === null ? "estimated" : "reported";

  const feeMinor = Math.min(
    reported ?? Math.floor((requestedMinor * fallbackBps) / 10000),
    requestedMinor
  );

  return {
    requestedMinor,
    feeMinor,
    netAmountMinor: requestedMinor - feeMinor,
    feeSource,
  };
}

/**
 * How much must be available in the source account to send `requestedMinor`.
 *
 * This is the single switch for "does Monime take the payout fee out of the amount, or on
 * top of it" — see `PAYOUT_FEE_CHARGED_ON_TOP`. Every balance check goes through here so
 * the answer lives in exactly one place.
 */
export function requiredDebitMinor(
  requestedMinor: number,
  payoutFeeBps: number = MONIME_PAYOUT_FEE_BPS_FALLBACK
): number {
  const requested = toNonNegativeInt(requestedMinor);
  if (!PAYOUT_FEE_CHARGED_ON_TOP) return requested;
  return requested + Math.floor((requested * toNonNegativeInt(payoutFeeBps)) / 10000);
}
