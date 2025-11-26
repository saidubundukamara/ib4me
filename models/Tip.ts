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
  paymentFeeMinor?: number;
}

export interface ITip extends mongoose.Document {
  tipperId?: mongoose.Types.ObjectId | null;
  tipperSnapshot?: { name?: string; email?: string; phone?: string } | null;
  isAnonymous: boolean;
  message?: string | null;
  amount: ITipAmount;
  provider: ITipProvider;
  status: "pending" | "succeeded" | "failed" | "refunded";
  fees?: ITipFees | null;
  netAmountMinor?: number | null;
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
    fees: {
      paymentFeeMinor: { type: Number, default: 0 },
    },
    netAmountMinor: { type: Number, default: null },
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
