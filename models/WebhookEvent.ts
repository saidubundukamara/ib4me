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
  relatedIds?: IWebhookEventRelatedIds | null;
}

const webhookEventSchema = new mongoose.Schema<IWebhookEvent>(
  {
    provider: { type: String, required: true },
    eventType: { type: String, required: true },
    idempotencyKey: { type: String, default: null, index: true },
    payloadRef: { type: Object, default: null },
    receivedAt: { type: Date, required: true, default: () => new Date() },
    processedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["received", "processed", "failed"],
      default: "received",
      index: true,
    },
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

export default mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", webhookEventSchema);
