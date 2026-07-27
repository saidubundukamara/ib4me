import type { FeeSettings } from "@/lib/settings-provider";
import { computeDonationSplit } from "@/lib/fees";
import { formatMinor, formatBps, toMinor } from "@/lib/currency";

/**
 * Human-readable fee figures for static copy (FAQ, Terms, Pricing, Footer).
 *
 * Every rate comes from the live admin-configurable settings, so no page hardcodes a
 * percentage (MONIME-FEE-MODEL.md §8.2). It used to define its own `BASE_FEE_BPS = 100`,
 * one of five copies of that constant.
 *
 * Note the model these strings describe: fees are **deducted from** the donation, not
 * added on top. `exampleTotal` previously computed `amount * (1 + totalFee)`, which
 * described the opposite arrangement — donors were told they would pay a surcharge that
 * no longer exists.
 */
export function getFeeDisplay(fees: FeeSettings | null) {
  const individualBps = fees?.processingFee?.individualBps ?? 260;
  const organizationBps = fees?.processingFee?.organizationBps ?? 200;
  const monimeBps = fees?.monimeCollectionFeeBpsEstimate ?? 100;
  const payoutBps = fees?.payoutFeeBpsEstimate ?? 100;

  const pct = (bps: number) => (bps / 100).toFixed(1); // "2.6" — bare number, no unit

  return {
    // Bare numbers, for copy that supplies its own "%" sign.
    payment: pct(monimeBps),
    individualPlatform: pct(individualBps),
    organizationPlatform: pct(organizationBps),
    individualTotal: pct(monimeBps + individualBps),
    organizationTotal: pct(monimeBps + organizationBps),
    payout: pct(payoutBps),

    // Pre-formatted, for copy that just interpolates.
    paymentPct: formatBps(monimeBps),
    individualPlatformPct: formatBps(individualBps),
    organizationPlatformPct: formatBps(organizationBps),
    individualTotalPct: formatBps(monimeBps + individualBps),
    organizationTotalPct: formatBps(organizationBps + monimeBps),
    payoutPct: formatBps(payoutBps),

    /**
     * What a campaign actually receives from a donation of `amountMajor`.
     *
     * Runs the real fee engine on minor units rather than approximating in decimals, so
     * marketing copy cannot quote a number the charge path would never produce.
     */
    exampleReceives: (amountMajor: number, type: "individual" | "organization" = "individual") => {
      const split = computeDonationSplit({
        grossMinor: toMinor(amountMajor),
        platformFeeBps: type === "organization" ? organizationBps : individualBps,
        monimeFeeBpsFallback: monimeBps,
      });
      return formatMinor(split.campaignReceivesMinor);
    },
  };
}

export type FeeDisplay = ReturnType<typeof getFeeDisplay>;
