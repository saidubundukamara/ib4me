import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  monimeService,
  MonimeWebhookPayload,
  MonimeWebhookCheckoutSessionData,
  MonimePayment,
} from "@/lib/monime";
import { donationService } from "@/services";

// Simple in-memory cache for webhook event IDs (in production, use Redis or database)
const processedWebhooks = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await req.text();

    // Get the signature from headers (check Monime docs for correct header name)
    const headersList = await headers();
    const signature =
      headersList.get("x-monime-signature") ||
      headersList.get("monime-signature") ||
      "";

    // TODO: Implement proper webhook signature verification based on Monime docs
    // For now, we're logging the signature for analysis
    if (signature) {
      // console.log(
      //   "Webhook signature received:",
      //   signature.substring(0, 20) + "..."
      // );
      // TODO: Verify signature using Monime's webhook secret
      // const isValidSignature = monimeService.verifyWebhookSignature(body, signature);
      // if (!isValidSignature) {
      //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      // }
    } else {
      console.warn(
        "No webhook signature found in headers - implement signature verification"
      );
    }

    // Parse webhook payload
    const webhookPayload: MonimeWebhookPayload =
      monimeService.parseWebhookPayload(body);

    // console.log("Received Monime webhook:", {
    //   event: webhookPayload.event,
    //   timestamp: webhookPayload.timestamp,
    // });

    // Idempotency check - prevent processing the same webhook event twice
    const eventId = webhookPayload.event.id;
    if (processedWebhooks.has(eventId)) {
      console.log(`Webhook event ${eventId} already processed, skipping`);
      return NextResponse.json({
        success: true,
        message: "Event already processed",
      });
    }

    // Handle different event types
    switch (webhookPayload.event.name) {
      case "checkout_session.completed":
        await handleCheckoutSessionCompleted(webhookPayload);
        break;

      case "checkout_session.failed":
        await handleCheckoutSessionFailed(webhookPayload);
        break;

      case "payment.completed":
        await handlePaymentCompleted(webhookPayload);
        break;

      case "payment.failed":
        await handlePaymentFailed(webhookPayload);
        break;

      default:
        console.log(`Unhandled webhook event: ${webhookPayload.event.name}`);
    }

    // Mark event as processed
    processedWebhooks.add(eventId);

    // Clean up old processed events (keep last 1000 to prevent memory leaks)
    if (processedWebhooks.size > 1000) {
      const eventsArray = Array.from(processedWebhooks);
      processedWebhooks.clear();
      eventsArray.slice(-500).forEach((id) => processedWebhooks.add(id));
    }

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
  // console.log(
  //   "Handling checkout session completed event:",
  //   JSON.stringify(payload, null, 2)
  // );

  const checkoutSessionData = payload.data as MonimeWebhookCheckoutSessionData;

  if (!checkoutSessionData?.metadata?.donationId) {
    console.error("No donationId found in checkout session metadata");
    return;
  }

  const donationId = checkoutSessionData.metadata.donationId;
  const checkoutSessionId = checkoutSessionData.id;

  try {
    // console.log(
    //   `Processing checkout session completed for donation ${donationId}`
    // );

    // Get the donation to check current state
    const donation = await donationService.getById(donationId);
    if (!donation) {
      console.error(`Donation ${donationId} not found`);
      return;
    }

    // Update checkout session ID if not already set
    if (!donation.provider.checkoutSessionId) {
      await donationService.updateCheckoutSession(
        donationId,
        checkoutSessionId
      );
      console.log(
        `Updated donation ${donationId} with checkout session ID ${checkoutSessionId}`
      );
    }

    // For checkout session completed, we typically wait for payment.completed
    // But if the status indicates it's fully completed, we can mark as succeeded
    if (checkoutSessionData.status === "completed") {
      // Check if donation is still pending
      if (donation.status === "pending") {
        // Mark as succeeded - this will update campaign totals and create ledger entries
        await donationService.markSucceeded(donationId);
        console.log(`Marked donation ${donationId} as succeeded`);
      }
    }
  } catch (error) {
    console.error(
      `Error processing checkout session completed for donation ${donationId}:`,
      error
    );
    throw error;
  }
}

async function handleCheckoutSessionFailed(payload: MonimeWebhookPayload) {
  // console.log(
  //   "Handling checkout session failed event:",
  //   JSON.stringify(payload, null, 2)
  // );

  const checkoutSessionData = payload.data as MonimeWebhookCheckoutSessionData;

  if (!checkoutSessionData?.metadata?.donationId) {
    console.error("No donationId found in checkout session metadata");
    return;
  }

  const donationId = checkoutSessionData.metadata.donationId;

  try {
    console.log(
      `Processing checkout session failed for donation ${donationId}`
    );

    // Mark donation as failed
    await donationService.markFailed(donationId, "Checkout session failed");
    console.log(`Marked donation ${donationId} as failed`);
  } catch (error) {
    console.error(
      `Error processing checkout session failed for donation ${donationId}:`,
      error
    );
    throw error;
  }
}

async function handlePaymentCompleted(payload: MonimeWebhookPayload) {
  console.log(
    "Handling payment completed event:",
    JSON.stringify(payload, null, 2)
  );

  const payment = payload.data as MonimePayment;

  if (!payment?.checkoutSessionId) {
    console.error("No checkoutSessionId found in payment data");
    return;
  }

  try {
    console.log(
      `Processing payment completed for checkout session ${payment.checkoutSessionId}`
    );

    // Get checkout session to find donation ID
    const checkoutSession = await monimeService.getCheckoutSession(
      payment.checkoutSessionId
    );
    const donationIdRaw = checkoutSession.metadata?.donationId;
    if (typeof donationIdRaw !== "string" || !donationIdRaw) {
      console.error("No donationId found in checkout session metadata");
      return;
    }
    const donationId = donationIdRaw;

    console.log(`Found donation ID ${donationId} for payment ${payment.id}`);

    // Mark donation as succeeded with payment details
    await donationService.markSucceededWithPaymentDetails(donationId, {
      paymentId: payment.id,
      paymentMethod: payment.paymentMethod,
      fees: payment.fees,
      completedAt: payment.completedAt,
    });

    console.log(
      `Successfully processed payment completion for donation ${donationId}`
    );
  } catch (error) {
    console.error(`Error processing payment completed:`, error);
    throw error;
  }
}

async function handlePaymentFailed(payload: MonimeWebhookPayload) {
  console.log(
    "Handling payment failed event:",
    JSON.stringify(payload, null, 2)
  );

  const payment = payload.data as MonimePayment;

  if (!payment?.checkoutSessionId) {
    console.error("No checkoutSessionId found in payment data");
    return;
  }

  try {
    console.log(
      `Processing payment failed for checkout session ${payment.checkoutSessionId}`
    );

    // Get checkout session to find donation ID
    const checkoutSession = await monimeService.getCheckoutSession(
      payment.checkoutSessionId
    );
    const donationIdRaw = checkoutSession.metadata?.donationId;
    if (typeof donationIdRaw !== "string" || !donationIdRaw) {
      console.error("No donationId found in checkout session metadata");
      return;
    }
    const donationId = donationIdRaw;

    console.log(
      `Found donation ID ${donationId} for failed payment ${payment.id}`
    );

    // Mark donation as failed with failure reason
    const failureReason = payment.failureReason || "Payment processing failed";
    await donationService.markFailed(donationId, failureReason);

    console.log(`Marked donation ${donationId} as failed: ${failureReason}`);
  } catch (error) {
    console.error(`Error processing payment failed:`, error);
    throw error;
  }
}
