import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import { sumMonimeFees } from "@/lib/fees";
import type { MonimeFees } from "@/lib/monime";

/**
 * Dev-only Monime settlement simulator.
 *
 * ## Why this exists
 *
 * MONIME-FEE-MODEL.md §9 names the absence of this endpoint as the root cause of the whole
 * defect class shipping unnoticed: the fake provider only ever fired the fee-less event, so
 * local development could never observe Monime taking its cut, and every campaign-facing
 * figure read as gross — correctly, given the data it was fed.
 *
 * So this deliberately reproduces the two things a naive stub gets wrong:
 *
 * 1. It emits **both** events for one payment — `checkout_session.completed` carries no
 *    fees, `payment.processing_completed` does.
 * 2. It lets you **flip their order** (`?order=payment-first`), so the race in R6 can be
 *    exercised from both sides. Both orderings must converge on identical balances.
 *
 * ## Usage
 *
 *   POST /api/dev/monime-webhook?donationId=<id>
 *   POST /api/dev/monime-webhook?donationId=<id>&order=payment-first
 *   POST /api/dev/monime-webhook?donationId=<id>&feeBps=250   # simulate a rate change
 *   POST /api/dev/monime-webhook?donationId=<id>&sessionOnly=1 # settle with NO fee data
 *
 * Never available when `MONIME_ENVIRONMENT=live`.
 */
export async function POST(req: NextRequest) {
  if (process.env.MONIME_ENVIRONMENT === "live") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const params = req.nextUrl.searchParams;
  const donationId = params.get("donationId");
  if (!donationId) {
    return NextResponse.json({ error: "donationId is required" }, { status: 400 });
  }

  const donation = await donationService.getById(donationId);
  if (!donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  const feeBps = Number(
    params.get("feeBps") ?? process.env.MONIME_FAKE_FEE_BPS ?? 100
  );
  const paymentFirst = params.get("order") === "payment-first";
  const sessionOnly = params.get("sessionOnly") === "1";

  // The documented array shape, not the legacy `{ total, breakdown }` object — a stub that
  // emits the wrong shape is how the parser bug stayed hidden.
  const fees: MonimeFees = [
    {
      amount: {
        currency: donation.amount.currency,
        value: Math.floor((donation.amount.minor * feeBps) / 10000),
      },
      code: "Base",
    },
  ];

  // Unique per capture. A payment settled in two installments is charged twice, each
  // rounded independently, and a per-donation id would swallow the second correction.
  const monimePaymentId = `spm-fake-${donationId}-${feeBps}`;

  const sessionEvent = () =>
    donationService.applySettlement(donationId, {
      source: "webhook_session",
      monimeFeeMinor: null, // this event genuinely carries no fee data
      paymentMethod: { type: "checkout_session", provider: "MONIME" },
      completedAt: new Date().toISOString(),
    });

  const paymentEvent = () =>
    donationService.applySettlement(donationId, {
      source: "webhook_payment",
      monimeFeeMinor: sumMonimeFees(fees),
      monimePaymentId,
      financialTransactionReference: `fake-ftr-${donationId}`,
      channelReference: `fake-mno-${donationId}`,
      completedAt: new Date().toISOString(),
    });

  const order: string[] = [];
  if (sessionOnly) {
    await sessionEvent();
    order.push("checkout_session.completed");
  } else if (paymentFirst) {
    await paymentEvent();
    order.push("payment.processing_completed");
    await sessionEvent();
    order.push("checkout_session.completed");
  } else {
    await sessionEvent();
    order.push("checkout_session.completed");
    await paymentEvent();
    order.push("payment.processing_completed");
  }

  const settled = await donationService.getById(donationId);

  return NextResponse.json({
    success: true,
    simulated: { order, feeBps, monimePaymentId, fees },
    settlement: settled?.settlement ?? null,
    hint: "Run again with ?order=payment-first on a fresh donation — the settlement block must come out identical.",
  });
}
