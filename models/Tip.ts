import mongoose from "mongoose";

export interface ITipAmount {
  currency: string;
  minor: number;
}

export interface ITipProvider {
  name: string;
  paymentId?: string;
  checkoutSessionId?: string;
}

export interface ITipFees {
  /** Mirror of `settlement.monimeFeeMinor`. See the note there about `default: 0`. */
  paymentFeeMinor?: number;
}

/**
 * The authoritative record of what Monime actually took from a tip.
 *
 * `fees.paymentFeeMinor` alone cannot carry this, and the reason is precise: it defaults
 * to `0`, so it cannot distinguish "Monime charged nothing" from "this event never told
 * us the fee". That distinction is the whole of the two-event race — Monime fires
 * `checkout_session.completed` (no fees) and `payment.processing_completed` (fees) for one
 * payment, either can arrive first, and a fee of `0` written by the fee-less one silently
 * destroys the real figure (MONIME-FEE-MODEL.md R6).
 *
 * `monimeFeeSource` and `appliedAt` are the two load-bearing fields: together they say
 * "settled, and here is whether the fee is real or assumed."
 */
export interface ITipSettlement {
  grossMinor: number;
  monimeFeeMinor: number;
  monimeFeeSource: "reported" | "estimated";
  /** gross − monimeFee. A tip has no platform fee, so this IS the net. */
  netMinor: number;
  monimePaymentId?: string;
  financialTransactionReference?: string;
  channelReference?: string;
  appliedAt?: Date;
  correctedAt?: Date;
}

export interface ITip extends mongoose.Document {
  tipperId?: mongoose.Types.ObjectId | null;
  tipperSnapshot?: { name?: string; email?: string; phone?: string } | null;
  isAnonymous: boolean;
  message?: string | null;
  amount: ITipAmount;
  provider: ITipProvider;
  status: "pending" | "succeeded" | "failed" | "refunded";
  settlement?: ITipSettlement | null;
  fees?: ITipFees | null;
  /** Mirror of `settlement.netMinor`, kept for existing admin readers. */
  netAmountMinor?: number | null;
  /** Where the tip came from, so the thank-you-page CTA can be measured. */
  source?: "tip_page" | "donation_success";
  receiptUrl?: string | null;
  idempotencyKey?: string | null;
  failureReason?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const tipSchema = new mongoose.Schema<ITip>(
  {
    tipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tipperSnapshot: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    isAnonymous: { type: Boolean, default: false },
    message: { type: String, default: null },
    amount: {
      currency: { type: String, required: true },
      minor: { type: Number, required: true, min: 0 },
    },
    provider: {
      name: { type: String, required: true },
      paymentId: { type: String },
      checkoutSessionId: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    settlement: {
      grossMinor: { type: Number },
      monimeFeeMinor: { type: Number },
      monimeFeeSource: {
        type: String,
        enum: ["reported", "estimated"],
      },
      netMinor: { type: Number },
      monimePaymentId: { type: String },
      financialTransactionReference: { type: String },
      channelReference: { type: String },
      appliedAt: { type: Date },
      correctedAt: { type: Date },
    },
    fees: {
      // No `default: 0` — that default is exactly what makes this field unable to say
      // "unknown", which is why `settlement` exists. Kept as a mirror for admin readers.
      paymentFeeMinor: { type: Number },
    },
    netAmountMinor: { type: Number, default: null },
    source: {
      type: String,
      enum: ["tip_page", "donation_success"],
      default: "tip_page",
    },
    receiptUrl: { type: String, default: null },
    idempotencyKey: { type: String, default: null, index: true },
    failureReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

tipSchema.index({ status: 1, createdAt: -1 });
tipSchema.index({ tipperId: 1, createdAt: -1 });

export default mongoose.models.Tip || mongoose.model<ITip>("Tip", tipSchema);
