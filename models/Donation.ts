import mongoose from "mongoose";

export interface IDonationAmount {
  currency: string;
  minor: number;
}

export interface IDonationFx {
  displayCurrency?: string;
  rate?: number;
  source?: string;
}

export interface IDonationProvider {
  name: string;
  paymentId?: string;
  checkoutSessionId?: string;
}

export interface IDonationFees {
  paymentFeeMinor?: number;
  platformFeeMinor?: number;
}

export interface IDonation extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId | null;
  donorSnapshot?: { name?: string; email?: string } | null;
  isAnonymous: boolean;
  message?: string | null;
  amount: IDonationAmount;
  fx?: IDonationFx | null;
  provider: IDonationProvider;
  status: "pending" | "succeeded" | "failed" | "refunded";
  fees?: IDonationFees | null;
  netAmountMinor?: number | null;
  receiptUrl?: string | null;
  notifiedAt?: Date | null;
  idempotencyKey?: string | null;
  failureReason?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new mongoose.Schema<IDonation>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    donorSnapshot: {
      name: { type: String },
      email: { type: String },
    },
    isAnonymous: { type: Boolean, default: false },
    message: { type: String, default: null },
    amount: {
      currency: { type: String, required: true },
      minor: { type: Number, required: true, min: 0 },
    },
    fx: {
      displayCurrency: { type: String },
      rate: { type: Number },
      source: { type: String },
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
      platformFeeMinor: { type: Number, default: 0 },
    },
    netAmountMinor: { type: Number, default: null },
    receiptUrl: { type: String, default: null },
    notifiedAt: { type: Date, default: null },
    idempotencyKey: { type: String, default: null, index: true },
    failureReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

donationSchema.index({ campaignId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Donation ||
  mongoose.model<IDonation>("Donation", donationSchema);
