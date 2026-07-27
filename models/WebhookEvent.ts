import mongoose from "mongoose";

export interface IWebhookEventRelatedIds {
  donationId?: mongoose.Types.ObjectId | null;
  campaignId?: mongoose.Types.ObjectId | null;
}

export interface IWebhookEvent extends mongoose.Document {
  provider: string;
  eventType: string;
  idempotencyKey?: string | null;
  payloadRef?: Record<string, unknown> | null;
  receivedAt: Date;
  processedAt?: Date | null;
  status: "received" | "processed" | "failed";
  /** Delivery attempts seen for this key — a climbing count means we keep failing. */
  attempts?: number;
  lastError?: string | null;
  relatedIds?: IWebhookEventRelatedIds | null;
}

const webhookEventSchema = new mongoose.Schema<IWebhookEvent>(
  {
    provider: { type: String, required: true },
    eventType: { type: String, required: true },
    // Indexed below via schema.index() — declaring `index: true` here as well creates
    // a duplicate, non-unique index alongside the partial unique one.
    idempotencyKey: { type: String, default: null },
    payloadRef: { type: Object, default: null },
    receivedAt: { type: Date, required: true, default: () => new Date() },
    processedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["received", "processed", "failed"],
      default: "received",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: null },
    relatedIds: {
      donationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
        default: null,
      },
      campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
        default: null,
      },
    },
  },
  { timestamps: false }
);

webhookEventSchema.index({ provider: 1, eventType: 1, receivedAt: -1 });

/**
 * Durable webhook idempotency. This replaces a process-local `Set`, which on serverless
 * is per-instance and lost on every cold start — so it never actually deduplicated
 * anything across the instances Monime's retries land on.
 *
 * `partialFilterExpression` rather than `sparse` because the field defaults to `null`;
 * see the same note on Donation and LedgerEntry.
 *
 * This dedups webhook *delivery*. It does not replace the ledger's own idempotency key,
 * which dedups the *business effect* across redeliveries that arrive with a fresh
 * delivery id (MONIME-FEE-MODEL.md §2 — key on `object.id`, not `event.id`).
 */
webhookEventSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export default mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", webhookEventSchema);
