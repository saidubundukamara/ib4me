import type { Metadata } from "next";
import TipClient from "./TipClient";

export const metadata: Metadata = {
  title: "Support ib4me",
  description:
    "Tip the platform to help keep ib4me running. Tips support ib4me itself, not individual campaigns.",
};

type PageProps = {
  searchParams: Promise<{ amount?: string; ref?: string }>;
};

/**
 * Server wrapper for the tip page.
 *
 * Reads `?amount=` here rather than with `useSearchParams` in the client component: in
 * Next 15 that hook forces the page out of static prerendering unless it is wrapped in a
 * Suspense boundary, and reading the param on the server sidesteps the problem entirely
 * while also allowing a real `metadata` export.
 *
 * The value is parsed but NOT trusted — `TipClient` validates it against the configured
 * min/max, and `/api/tips/create` re-validates server-side, so a tampered URL can only
 * fail closed.
 */
export default async function TipPage({ searchParams }: PageProps) {
  const { amount, ref } = await searchParams;
  const parsed = Number.parseInt(amount ?? "", 10);
  const initialAmountMinor =
    Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  // Attribution, whitelisted rather than passed through — without it there is no way to
  // tell whether the thank-you-page CTA actually works.
  const source = ref === "donation_success" ? "donation_success" : "tip_page";

  return <TipClient initialAmountMinor={initialAmountMinor} source={source} />;
}
