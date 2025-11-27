import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  monimeService,
  MonimeWebhookPayload,
  MonimeWebhookCheckoutSessionData,
  MonimePayment,
} from "@/lib/monime";
import { donationService, tipService, settingService } from "@/services";

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
      if (donation.status === "pending") {
        await donationService.markSucceeded(donationId);
        console.log(`Marked donation ${donationId} as succeeded`);
      }
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

async function handlePaymentCompleted(payload: MonimeWebhookPayload) {
  console.log("Handling payment completed event:", JSON.stringify(payload, null, 2));

  const payment = payload.data as MonimePayment;

  if (!payment?.checkoutSessionId) {
    console.error("No checkoutSessionId found in payment data");
    return;
  }

  try {
    console.log(`Processing payment completed for checkout session ${payment.checkoutSessionId}`);

    // Get checkout session to determine type (donation or tip)
    const checkoutSession = await monimeService.getCheckoutSession(payment.checkoutSessionId);

    // Check if this is a platform tip
    if (checkoutSession.metadata?.type === "platform_tip") {
      const tipId = checkoutSession.metadata?.tipId;
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
    const donationIdRaw = checkoutSession.metadata?.donationId;
    if (typeof donationIdRaw !== "string" || !donationIdRaw) {
      console.error("No donationId found in checkout session metadata");
      return;
    }
    const donationId = donationIdRaw;

    console.log(`Found donation ID ${donationId} for payment ${payment.id}`);

    // Step 1: Mark donation as payment_received
    const donation = await donationService.markPaymentReceived(donationId, {
      paymentId: payment.id,
      paymentMethod: payment.paymentMethod,
      fees: payment.fees,
      completedAt: payment.completedAt,
    });

    console.log(`Marked donation ${donationId} as payment_received`);

    // Step 2: Get campaign financial account ID from metadata
    const campaignFinancialAccountId = checkoutSession.metadata?.campaignFinancialAccountId;
    if (typeof campaignFinancialAccountId !== "string" || !campaignFinancialAccountId) {
      console.error(`No campaignFinancialAccountId in metadata for donation ${donationId}`);
      // Store error and skip transfer - admin will need to handle manually
      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Missing campaign financial account ID in metadata",
        initiatedAt: new Date(),
        retryCount: 0
      });
      return;
    }

    // Step 3: Get platform account
    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      console.error(`Platform account not configured for donation ${donationId}`);
      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Platform financial account not configured",
        initiatedAt: new Date(),
        retryCount: 0
      });
      return;
    }

    // Step 4: Initiate internal transfer from platform to campaign
    const transferAmount = donation.amount.minor; // Transfer donation amount only, not fees
    const idempotencyKey = `transfer_${donationId}_${Date.now()}`;

    try {
      console.log(`Initiating internal transfer of ${transferAmount} from platform to campaign for donation ${donationId}`);

      // Mark transfer as pending
      await donationService.updateTransferStatus(donationId, {
        status: "pending",
        initiatedAt: new Date(),
        retryCount: 0
      });

      const transfer = await monimeService.createInternalTransfer({
        amount: {
          currency: donation.amount.currency,
          value: transferAmount,
        },
        sourceFinancialAccount: {
          id: platformAccount.id,
        },
        destinationFinancialAccount: {
          id: campaignFinancialAccountId,
        },
        description: `Donation transfer for ${donationId}`,
        metadata: {
          donationId,
          type: "donation_transfer",
        },
      }, idempotencyKey);

      console.log(`Internal transfer created: ${transfer.id}, status: ${transfer.status}`);

      // Step 5: If transfer completed (synchronous), complete the donation
      if (transfer.status === "completed") {
        await donationService.completeWithTransfer(donationId, transfer.id);
        console.log(`Successfully completed donation ${donationId} with transfer ${transfer.id}`);
      } else if (transfer.status === "failed") {
        // Transfer failed
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "failed",
          failureReason: transfer.failureReason || "Transfer failed",
          retryCount: 1
        });
        console.error(`Transfer failed for donation ${donationId}: ${transfer.failureReason}`);
      } else {
        // Transfer is pending/processing - update status and wait
        // In practice, internal transfers are usually synchronous
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "pending",
        });
        console.log(`Transfer ${transfer.id} is ${transfer.status}, waiting for completion`);
      }
    } catch (transferError) {
      // Transfer API call failed
      console.error(`Transfer failed for donation ${donationId}:`, transferError);
      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: transferError instanceof Error ? transferError.message : "Transfer API error",
        retryCount: 1
      });
    }
  } catch (error) {
    console.error(`Error processing payment completed:`, error);
    throw error;
  }
}

async function handlePaymentFailed(payload: MonimeWebhookPayload) {
  console.log("Handling payment failed event:", JSON.stringify(payload, null, 2));

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

    // Check if this is a platform tip
    if (checkoutSession.metadata?.type === "platform_tip") {
      const tipId = checkoutSession.metadata?.tipId;
      if (typeof tipId !== "string" || !tipId) {
        console.error("No tipId found in checkout session metadata for platform tip");
        return;
      }

      console.log(`Found tip ID ${tipId} for failed payment ${payment.id}`);
      await tipService.markFailed(tipId, failureReason);
      console.log(`Marked tip ${tipId} as failed: ${failureReason}`);
      return;
    }

    // Handle as donation
    const donationIdRaw = checkoutSession.metadata?.donationId;
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
