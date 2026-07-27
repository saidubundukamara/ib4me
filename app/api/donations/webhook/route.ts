import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  monimeService,
  MonimeWebhookPayload,
  MonimeWebhookCheckoutSessionData,
  MonimePayment,
  resolveCheckoutSessionId,
} from "@/lib/monime";
import { donationService, tipService } from "@/services";
import { webhookEventRepository } from "@/repositories";
import { sumMonimeFees } from "@/lib/fees";

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await req.text();

    // Get the Monime signature header (format: t=<timestamp>,v1=<base64>)
    const headersList = await headers();
    const signature = headersList.get("monime-signature") || "";

    // Verify webhook signature against the raw body. Always enforced — invalid or
    // missing signatures are rejected. See monimeService.verifyWebhookSignature.
    const isValidSignature = monimeService.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    const webhookPayload: MonimeWebhookPayload =
      monimeService.parseWebhookPayload(body);

    // console.log("Received Monime webhook:", {
    //   event: webhookPayload.event,
    //   timestamp: webhookPayload.timestamp,
    // });

    // Durable idempotency. This was an in-memory Set, which on serverless is
    // per-instance and lost on cold start — it never deduplicated anything across the
    // instances Monime's retries actually land on.
    const eventId = webhookPayload.event.id;
    const idempotencyKey = `monime:${eventId}`;
    const claimed = await webhookEventRepository.claim(
      idempotencyKey,
      "monime",
      webhookPayload.event.name
    );
    if (!claimed) {
      console.log(`Webhook event ${eventId} already processed, skipping`);
      return NextResponse.json({
        success: true,
        message: "Event already processed",
      });
    }

    try {
    // Handle different event types
    switch (webhookPayload.event.name) {
      case "checkout_session.completed":
        await handleCheckoutSessionCompleted(webhookPayload);
        break;

      case "checkout_session.failed":
        await handleCheckoutSessionFailed(webhookPayload);
        break;

      case "checkout_session.cancelled":
        await handleCheckoutSessionCancelled(webhookPayload);
        break;

      case "checkout_session.expired":
        await handleCheckoutSessionExpired(webhookPayload);
        break;

      // `payment.processing_completed` is the documented settlement event and the only
      // one that carries `fees[]`. `payment.completed` is what this integration
      // originally assumed; both are handled until a live payment settles which fires.
      case "payment.processing_completed":
      case "payment.completed":
        await handlePaymentCompleted(webhookPayload);
        break;

      case "payment.failed":
        await handlePaymentFailed(webhookPayload);
        break;

      default:
        console.log(`Unhandled webhook event: ${webhookPayload.event.name}`);
    }
    } catch (handlerError) {
      // Release the claim so Monime's retry can succeed, then fail loudly.
      await webhookEventRepository.markFailed(
        idempotencyKey,
        handlerError instanceof Error ? handlerError.message : String(handlerError)
      );
      throw handlerError;
    }

    await webhookEventRepository.markProcessed(idempotencyKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Parse errors should return 400 to prevent retries
    if (error instanceof Error && error.message.includes("parse")) {
      console.error("Failed to parse webhook payload");
      return NextResponse.json(
        { error: "Invalid payload format", success: false },
        { status: 400 }
      );
    }

    // Business logic errors should return 400 to prevent retries
    if (
      error instanceof Error &&
      (error.message.includes("Donation not found") ||
        error.message.includes("Cannot mark donation"))
    ) {
      console.error("Business logic error:", error.message);
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    // System errors should return 500 so Monime retries
    console.error("System error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal processing error", success: false },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(payload: MonimeWebhookPayload) {
  const checkoutSessionData = payload.data as MonimeWebhookCheckoutSessionData;
  const checkoutSessionId = checkoutSessionData.id;

  // Check if this is a platform tip
  if (checkoutSessionData?.metadata?.type === "platform_tip") {
    await handleTipCheckoutSessionCompleted(checkoutSessionData);
    return;
  }

  // Handle as donation
  if (!checkoutSessionData?.metadata?.donationId) {
    console.error("No donationId found in checkout session metadata");
    return;
  }

  const donationId = checkoutSessionData.metadata.donationId;

  try {
    const donation = await donationService.getById(donationId);
    if (!donation) {
      console.error(`Donation ${donationId} not found`);
      return;
    }

    if (!donation.provider.checkoutSessionId) {
      await donationService.updateCheckoutSession(donationId, checkoutSessionId);
      console.log(`Updated donation ${donationId} with checkout session ID ${checkoutSessionId}`);
    }

    if (checkoutSessionData.status === "completed") {
      // This event carries NO fee data, so it settles on an estimate.
      //
      // `monimeFeeMinor: null` is the load-bearing part. It means UNKNOWN. This used to
      // pass no fee at all, which wrote `paymentFeeMinor: 0` — and since either event can
      // arrive first, that destroyed the real fee roughly half the time (R6). Passing
      // null makes applySettlement return without writing when the payment event has
      // already recorded the true figure.
      //
      // Note `checkoutSessionId` is no longer written into `provider.paymentId`: that
      // field holds Monime's `spm-…` payment id, which is the per-capture correction key.
      await donationService.applySettlement(donationId, {
        source: "webhook_session",
        monimeFeeMinor: null,
        paymentMethod: { type: "checkout_session", provider: "MONIME" },
        completedAt: new Date().toISOString(),
      });
      console.log(`Settled donation ${donationId} from checkout session (fee unknown)`);
    }
  } catch (error) {
    console.error(`Error processing checkout session completed for donation ${donationId}:`, error);
    throw error;
  }
}

async function handleTipCheckoutSessionCompleted(checkoutSessionData: MonimeWebhookCheckoutSessionData) {
  const tipId = checkoutSessionData.metadata?.tipId;
  if (typeof tipId !== "string" || !tipId) {
    console.error("No tipId found in checkout session metadata for platform tip");
    return;
  }

  const checkoutSessionId = checkoutSessionData.id;

  try {
    const tip = await tipService.getById(tipId);
    if (!tip) {
      console.error(`Tip ${tipId} not found`);
      return;
    }

    if (!tip.provider.checkoutSessionId) {
      await tipService.updateCheckoutSession(tipId, checkoutSessionId);
      console.log(`Updated tip ${tipId} with checkout session ID ${checkoutSessionId}`);
    }

    if (checkoutSessionData.status === "completed") {
      if (tip.status === "pending") {
        await tipService.markSucceeded(tipId);
        console.log(`Marked tip ${tipId} as succeeded`);
      }
    }
  } catch (error) {
    console.error(`Error processing checkout session completed for tip ${tipId}:`, error);
    throw error;
  }
}

async function handleCheckoutSessionFailed(payload: MonimeWebhookPayload) {
  const checkoutSessionData = payload.data as MonimeWebhookCheckoutSessionData;

  // Check if this is a platform tip
  if (checkoutSessionData?.metadata?.type === "platform_tip") {
    const tipId = checkoutSessionData.metadata?.tipId;
    if (typeof tipId === "string" && tipId) {
      try {
        await tipService.markFailed(tipId, "Checkout session failed");
        console.log(`Marked tip ${tipId} as failed`);
      } catch (error) {
        console.error(`Error processing checkout session failed for tip ${tipId}:`, error);
        throw error;
      }
    }
    return;
  }

  // Handle as donation
  if (!checkoutSessionData?.metadata?.donationId) {
    console.error("No donationId found in checkout session metadata");
    return;
  }

  const donationId = checkoutSessionData.metadata.donationId;

  try {
    console.log(`Processing checkout session failed for donation ${donationId}`);
    await donationService.markFailed(donationId, "Checkout session failed");
    console.log(`Marked donation ${donationId} as failed`);
  } catch (error) {
    console.error(`Error processing checkout session failed for donation ${donationId}:`, error);
    throw error;
  }
}

async function handleCheckoutSessionCancelled(payload: MonimeWebhookPayload) {
  const checkoutSessionData = payload.data as MonimeWebhookCheckoutSessionData;

  // Check if this is a platform tip
  if (checkoutSessionData?.metadata?.type === "platform_tip") {
    const tipId = checkoutSessionData.metadata?.tipId;
    if (typeof tipId === "string" && tipId) {
      try {
        await tipService.markFailed(tipId, "Checkout session cancelled by user");
        console.log(`Marked tip ${tipId} as cancelled`);
      } catch (error) {
        console.error(`Error processing checkout session cancelled for tip ${tipId}:`, error);
        throw error;
      }
    }
    return;
  }

  // Handle as donation
  if (!checkoutSessionData?.metadata?.donationId) {
    console.error("No donationId found in checkout session metadata");
    return;
  }

  const donationId = checkoutSessionData.metadata.donationId;

  try {
    console.log(`Processing checkout session cancelled for donation ${donationId}`);
    await donationService.markFailed(donationId, "Checkout session cancelled by user");
    console.log(`Marked donation ${donationId} as cancelled`);
  } catch (error) {
    console.error(`Error processing checkout session cancelled for donation ${donationId}:`, error);
    throw error;
  }
}

async function handleCheckoutSessionExpired(payload: MonimeWebhookPayload) {
  const checkoutSessionData = payload.data as MonimeWebhookCheckoutSessionData;

  // Check if this is a platform tip
  if (checkoutSessionData?.metadata?.type === "platform_tip") {
    const tipId = checkoutSessionData.metadata?.tipId;
    if (typeof tipId === "string" && tipId) {
      try {
        await tipService.markFailed(tipId, "Checkout session expired");
        console.log(`Marked tip ${tipId} as expired`);
      } catch (error) {
        console.error(`Error processing checkout session expired for tip ${tipId}:`, error);
        throw error;
      }
    }
    return;
  }

  // Handle as donation
  if (!checkoutSessionData?.metadata?.donationId) {
    console.error("No donationId found in checkout session metadata");
    return;
  }

  const donationId = checkoutSessionData.metadata.donationId;

  try {
    console.log(`Processing checkout session expired for donation ${donationId}`);
    await donationService.markFailed(donationId, "Checkout session expired");
    console.log(`Marked donation ${donationId} as expired`);
  } catch (error) {
    console.error(`Error processing checkout session expired for donation ${donationId}:`, error);
    throw error;
  }
}

async function handlePaymentCompleted(payload: MonimeWebhookPayload) {
  // Log only non-sensitive event metadata
  console.log("Handling payment completed event:", {
    eventId: payload.event.id,
    eventName: payload.event.name,
    timestamp: new Date().toISOString(),
  });

  const payment = payload.data as MonimePayment;

  // The live API puts the session id at `data.ownershipGraph.owner`, not at
  // `data.checkoutSessionId` — resolveCheckoutSessionId tries both.
  const checkoutSessionId = resolveCheckoutSessionId(payment);
  if (!checkoutSessionId) {
    console.error("No checkout session id found in payment data (checked ownershipGraph)");
    return;
  }

  // Monime's cut, netted out BEFORE the money reached us. `null` means it wasn't
  // reported — never coerce that to zero.
  const monimeFeeMinor = sumMonimeFees(payment.fees);

  try {
    console.log(`Processing payment completed for checkout session ${checkoutSessionId}`);

    // Get checkout session to determine type (donation or tip)
    const checkoutSession = await monimeService.getCheckoutSession(checkoutSessionId);

    // Check if this is a platform tip (metadata is inside result object)
    if (checkoutSession.result.metadata?.type === "platform_tip") {
      const tipId = checkoutSession.result.metadata?.tipId;
      if (typeof tipId !== "string" || !tipId) {
        console.error("No tipId found in checkout session metadata for platform tip");
        return;
      }

      console.log(`Found tip ID ${tipId} for payment ${payment.id}`);

      await tipService.markSucceededWithPaymentDetails(tipId, {
        paymentId: payment.id,
        paymentMethod: payment.paymentMethod,
        fees: payment.fees,
        completedAt: payment.completedAt,
      });

      console.log(`Successfully processed payment completion for tip ${tipId}`);
      return;
    }

    // Handle as donation - NEW PLATFORM-FIRST FLOW
    const donationIdRaw = checkoutSession.result.metadata?.donationId;
    if (typeof donationIdRaw !== "string" || !donationIdRaw) {
      console.error("No donationId found in checkout session metadata");
      return;
    }
    const donationId = donationIdRaw;

    console.log(`Found donation ID ${donationId} for payment ${payment.id}`);

    // Check current donation status first
    const existingDonation = await donationService.getById(donationId);
    if (!existingDonation) {
      console.error(`Donation ${donationId} not found`);
      return;
    }

    // NOTE: there is deliberately no "already succeeded, skip" guard here.
    //
    // This event is the ONLY one that carries Monime's actual fee, and it can arrive
    // after the fee-less checkout-session event has already settled and transferred the
    // donation. Returning early in that case is precisely how the real fee got lost
    // roughly half the time (MONIME-FEE-MODEL.md R6). `applySettlement` knows how to
    // correct an already-settled donation — and when the money has already moved, it
    // books the difference as a platform variance rather than rewriting history (R14).
    //
    // Step 1: settle, or correct, with the AUTHORITATIVE fee.
    await donationService.applySettlement(donationId, {
      source: "webhook_payment",
      monimeFeeMinor,
      monimePaymentId: payment.id,
      financialTransactionReference: payment.financialTransactionReference,
      channelReference: payment.channel?.reference,
      paymentMethod: payment.paymentMethod,
      completedAt: payment.completedAt,
    });
    console.log(
      `[webhook] Settled donation ${donationId} with ` +
        (monimeFeeMinor === null
          ? "NO reported Monime fee (estimated)"
          : `reported Monime fee ${monimeFeeMinor}`)
    );

    // Step 2: Move funds from the platform account to the campaign's financial
    // account and settle the donation. This is the RELIABLE trigger (the
    // browser success-redirect often never fires for mobile-money donors).
    // settleTransfer handles account resolution, idempotency, polling, and the
    // already-completed / already-succeeded short-circuits internally.
    const result = await donationService.settleTransfer(donationId, {
      source: "webhook",
    });
    console.log(
      `[webhook] settleTransfer for donation ${donationId}: ${result.status}` +
        (result.reason ? ` (${result.reason})` : "")
    );
  } catch (error) {
    console.error(`Error processing payment completed:`, error);
    throw error;
  }
}

async function handlePaymentFailed(payload: MonimeWebhookPayload) {
  // Log only non-sensitive event metadata
  console.log("Handling payment failed event:", {
    eventId: payload.event.id,
    eventName: payload.event.name,
    timestamp: new Date().toISOString(),
  });

  const payment = payload.data as MonimePayment;

  if (!payment?.checkoutSessionId) {
    console.error("No checkoutSessionId found in payment data");
    return;
  }

  try {
    console.log(`Processing payment failed for checkout session ${payment.checkoutSessionId}`);

    // Get checkout session to determine type (donation or tip)
    const checkoutSession = await monimeService.getCheckoutSession(payment.checkoutSessionId);
    const failureReason = payment.failureReason || "Payment processing failed";

    // Check if this is a platform tip (metadata is inside result object)
    if (checkoutSession.result.metadata?.type === "platform_tip") {
      const tipId = checkoutSession.result.metadata?.tipId;
      if (typeof tipId !== "string" || !tipId) {
        console.error("No tipId found in checkout session metadata for platform tip");
        return;
      }

      console.log(`Found tip ID ${tipId} for failed payment ${payment.id}`);
      await tipService.markFailed(tipId, failureReason);
      console.log(`Marked tip ${tipId} as failed: ${failureReason}`);
      return;
    }

    // Handle as donation (metadata is inside result object)
    const donationIdRaw = checkoutSession.result.metadata?.donationId;
    if (typeof donationIdRaw !== "string" || !donationIdRaw) {
      console.error("No donationId found in checkout session metadata");
      return;
    }
    const donationId = donationIdRaw;

    console.log(`Found donation ID ${donationId} for failed payment ${payment.id}`);
    await donationService.markFailed(donationId, failureReason);
    console.log(`Marked donation ${donationId} as failed: ${failureReason}`);
  } catch (error) {
    console.error(`Error processing payment failed:`, error);
    throw error;
  }
}
