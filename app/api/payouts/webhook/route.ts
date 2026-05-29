import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  monimeService,
  MonimeWebhookPayload,
  MonimePayoutResponse,
} from "@/lib/monime";
import { payoutService } from "@/services/PayoutService";

// Simple in-memory cache for webhook event IDs (in production, use Redis or database)
const processedWebhooks = new Set<string>();

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
      case "payout.completed":
        await handlePayoutCompleted(webhookPayload);
        break;

      case "payout.failed":
        await handlePayoutFailed(webhookPayload);
        break;

      default:
        console.log(`Unhandled payout webhook event: ${webhookPayload.event.name}`);
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

    // Update payout status in our database
    const updatedPayout = await payoutService.updatePayoutStatus(
      payout.id,
      "completed"
    );

    if (updatedPayout) {
      console.log(
        `Successfully updated payout ${updatedPayout.id} to completed status`
      );
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
    } else {
      console.warn(`Payout with Monime ID ${payout.id} not found in database`);
    }
  } catch (error) {
    console.error(`Error processing payout failed for ${payout.id}:`, error);
    throw error;
  }
}