import { unstable_cache } from "next/cache";
import { tipService } from "@/services";

export type PublicTippingState = {
  enabled: boolean;
  suggestedAmounts: number[];
  minAmountMinor: number;
  maxAmountMinor: number;
};

const FALLBACK: PublicTippingState = {
  enabled: false,
  suggestedAmounts: [],
  minAmountMinor: 0,
  maxAmountMinor: 0,
};

/**
 * Server-side tipping state for public pages, cached.
 *
 * The root layout renders on every request, so reading settings there unguarded would add
 * a database round trip to every page load for a flag that changes roughly never. A 60s
 * cache makes it effectively free while still picking up an admin toggle within a minute.
 *
 * Fails CLOSED: if settings cannot be read we report tipping as off. The cost of being
 * wrong in that direction is a missing link; the cost of the other direction is offering a
 * donor a payment route that will reject them.
 *
 * This is deliberately NOT `useSettings()`. That provider is mounted publicly but fetches
 * `/api/admin/settings`, which requires admin auth — so for a logged-out donor it silently
 * returns defaults, and anything gated on it would never render for the people it is meant
 * for.
 */
export const getTippingState = unstable_cache(
  async (): Promise<PublicTippingState> => {
    try {
      const state = await tipService.getPublicTippingState();

      // Say why nothing is showing, in the place the developer is already looking.
      //
      // The gate has three conditions and the admin panel can look enabled while one is
      // false, so "I turned it on and no link appeared" is otherwise indistinguishable
      // from a bug. Outside production only — this is a diagnostic, not an ops signal.
      if (!state.enabled && process.env.NODE_ENV !== "production") {
        const account = await tipService.getTipFinancialAccount();
        const missing: string[] = [];
        if (!account?.id) missing.push("tipFinancialAccount.id is not set");
        else if (!account?.uvan) {
          missing.push(
            "tipFinancialAccount.uvan is not set (BOTH id and uvan are required)"
          );
        }
        if (account?.id && account?.uvan) {
          missing.push("tipping.enabled is not true");
        }
        console.warn(
          `[tipping] Tip link hidden: ${missing.join("; ")}. ` +
            `Run \`npm run check:tipping\` for the full picture.`
        );
      }

      return state;
    } catch (error) {
      console.error("[tipping] could not resolve tipping state:", error);
      return FALLBACK;
    }
  },
  ["public-tipping-state"],
  { revalidate: 60, tags: ["tipping-settings"] }
);
