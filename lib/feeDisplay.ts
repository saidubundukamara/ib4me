import type { FeeSettings } from "@/lib/settings-provider";

// Monime's fixed payment-processing fee — mirrors pricing page & SettingService
const BASE_FEE_BPS = 100; // 1%

/**
 * Derive human-readable fee figures from the live (admin-configurable) fee
 * settings so user-facing copy (FAQ, Terms, Pricing) stays in sync with the
 * platform's actual fees instead of hardcoding percentages.
 */
export function getFeeDisplay(fees: FeeSettings | null) {
  const individualBps = fees?.processingFee?.individualBps ?? 260;
  const organizationBps = fees?.processingFee?.organizationBps ?? 200;
  const pct = (bps: number) => (bps / 100).toFixed(1); // e.g. "2.6"

  return {
    payment: pct(BASE_FEE_BPS), // "1.0"
    individualPlatform: pct(individualBps), // "2.6"
    organizationPlatform: pct(organizationBps), // "2.0"
    individualTotal: pct(BASE_FEE_BPS + individualBps), // "3.6"
    organizationTotal: pct(BASE_FEE_BPS + organizationBps), // "3.0"
    // Example: donor donates `amount`, pays amount + individual total fee.
    exampleTotal: (amount: number) =>
      (amount * (1 + (BASE_FEE_BPS + individualBps) / 10000)).toFixed(2), // "103.60"
  };
}

export type FeeDisplay = ReturnType<typeof getFeeDisplay>;
