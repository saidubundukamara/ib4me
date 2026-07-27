import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  monimeService,
  MonimeWebhookPayload,
  MonimePayoutResponse,
} from "@/lib/monime";
import { payoutService } from "@/services/PayoutService";
import { webhookEventRepository } from "@/repositories";
import { sumMonimeFees } from "@/lib/fees";
import { formatMinor } from "@/lib/currency";
import { createUserNotification } from "@/lib/createNotification";

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

    console.log("Received Monime payout webhook:", {
      event: webhookPayload.event,
      timestamp: webhookPayload.timestamp,
    });

    // Durable idempotency — see the note in the donations webhook. The in-memory Set
    // this replaces was per-instance and lost on cold start.
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
      case "payout.completed":
        await handlePayoutCompleted(webhookPayload);
        break;

      case "payout.failed":
        await handlePayoutFailed(webhookPayload);
        break;

      default:
        console.log(`Unhandled payout webhook event: ${webhookPayload.event.name}`);
    }
    } catch (handlerError) {
      await webhookEventRepository.markFailed(
        idempotencyKey,
        handlerError instanceof Error ? handlerError.message : String(handlerError)
      );
      throw handlerError;
    }

    await webhookEventRepository.markProcessed(idempotencyKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payout webhook processing error:", error);

    // Parse errors should return 400 to prevent retries
    if (error instanceof Error && error.message.includes("parse")) {
      console.error("Failed to parse payout webhook payload");
      return NextResponse.json(
        { error: "Invalid payload format", success: false },
        { status: 400 }
      );
    }

    // Business logic errors should return 400 to prevent retries
    if (
      error instanceof Error &&
      (error.message.includes("Payout not found") ||
        error.message.includes("Cannot update payout"))
    ) {
      console.error("Business logic error:", error.message);
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    // System errors should return 500 so Monime retries
    console.error("System error processing payout webhook:", error);
    return NextResponse.json(
      { error: "Internal processing error", success: false },
      { status: 500 }
    );
  }
}

async function handlePayoutCompleted(payload: MonimeWebhookPayload) {
  // Log only non-sensitive event metadata
  console.log("Handling payout completed event:", {
    eventId: payload.event.id,
    eventName: payload.event.name,
    timestamp: new Date().toISOString(),
  });

  const payout = payload.data as MonimePayoutResponse;

  if (!payout?.id) {
    console.error("No payout ID found in webhook payload");
    return;
  }

  try {
    console.log(`Processing payout completed for Monime payout ${payout.id}`);

    // The fee Monime actually kept out of the amount we sent. This event is the only
    // place it is ever reported, and it was previously discarded — leaving the campaign
    // owner looking at a gross figure they never received (R12).
    const monimeFeeMinor = sumMonimeFees(payout.fees);

    const updatedPayout = await payoutService.updatePayoutStatus(
      payout.id,
      "completed",
      undefined,
      { monimeFeeMinor }
    );

    if (updatedPayout) {
      console.log(
        `Successfully updated payout ${updatedPayout.id} to completed status`
      );
      // Tell them what they actually RECEIVED, not what they requested. Monime takes its
      // fee out of the amount sent, so quoting the requested figure here would be the same
      // "a number they will not receive" problem the payout columns exist to fix.
      // netAmountMinor is written moments earlier by applyPayoutCompletion.
      const receivedMinor =
        updatedPayout.netAmountMinor || updatedPayout.amountMinor;
      createUserNotification({
        recipientId: updatedPayout.requestedBy,
        type: "payout",
        title: "Payout completed",
        message:
          `${formatMinor(receivedMinor, updatedPayout.currency || "SLE")} has been sent ` +
          `to your mobile money account.`,
        link: "/dashboard/withdrawals",
      }).catch(() => {});
    } else {
      console.warn(`Payout with Monime ID ${payout.id} not found in database`);
    }
  } catch (error) {
    console.error(`Error processing payout completed for ${payout.id}:`, error);
    throw error;
  }
}

async function handlePayoutFailed(payload: MonimeWebhookPayload) {
  // Log only non-sensitive event metadata
  console.log("Handling payout failed event:", {
    eventId: payload.event.id,
    eventName: payload.event.name,
    timestamp: new Date().toISOString(),
  });

  const payout = payload.data as MonimePayoutResponse;

  if (!payout?.id) {
    console.error("No payout ID found in webhook payload");
    return;
  }

  try {
    console.log(`Processing payout failed for Monime payout ${payout.id}`);

    const failureReason = payout.failureReason || "Payout processing failed";

    // Update payout status in our database
    const updatedPayout = await payoutService.updatePayoutStatus(
      payout.id,
      "failed",
      failureReason
    );

    if (updatedPayout) {
      console.log(
        `Successfully updated payout ${updatedPayout.id} to failed status: ${failureReason}`
      );
      const amountSLE = (updatedPayout.amountMinor / 100).toFixed(2);
      createUserNotification({
        recipientId: updatedPayout.requestedBy,
        type: "payout",
        title: "Payout failed",
        message: `Your withdrawal of SLE ${amountSLE} could not be processed. ${failureReason}`,
        link: "/dashboard/withdrawals",
      }).catch(() => {});
    } else {
      console.warn(`Payout with Monime ID ${payout.id} not found in database`);
    }
  } catch (error) {
    console.error(`Error processing payout failed for ${payout.id}:`, error);
    throw error;
  }
}