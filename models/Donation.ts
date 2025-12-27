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
  // New fee structure (fees added on top)
  baseFeeMinor?: number;           // Fixed base fee (e.g., Le 0.50)
  processingFeeMinor?: number;     // Percentage-based processing fee
  processingFeeBps?: number;       // Rate applied (for audit trail)
  campaignType?: "individual" | "organization";  // Type at time of donation
  totalFeeMinor?: number;          // Total fees = baseFeeMinor + processingFeeMinor

  // Legacy fields (for backward compatibility with existing donations)
  paymentFeeMinor?: number;        // Payment processor fees from Monime
  platformFeeMinor?: number;
}

export interface IDonationTransfer {
  id?: string;              // Monime transfer ID
  status: "pending" | "completed" | "failed";
  initiatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  retryCount?: number;      // Number of retry attempts
}

export interface IDonation extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId | null;
  donorSnapshot?: { name?: string; email?: string } | null;
  isAnonymous: boolean;
  message?: string | null;
  amount: IDonationAmount;                    // Donation amount (what donor entered)
  totalChargedMinor?: number | null;          // Total charged to donor
  campaignReceivesMinor?: number | null;      // What campaign actually receives after fees
  donorCoversFee?: boolean;                   // Whether donor chose to cover fees
  fx?: IDonationFx | null;
  provider: IDonationProvider;
  status: "pending" | "payment_received" | "succeeded" | "failed" | "refunded";
  fees?: IDonationFees | null;
  transfer?: IDonationTransfer | null;        // Internal transfer tracking
  netAmountMinor?: number | null;             // For backward compat, equals amount.minor
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
      enum: ["pending", "payment_received", "succeeded", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    transfer: {
      id: { type: String },
      status: {
        type: String,
        enum: ["pending", "completed", "failed"]
      },
      initiatedAt: { type: Date },
      completedAt: { type: Date },
      failureReason: { type: String },
      retryCount: { type: Number, default: 0 },
    },
    fees: {
      // New fee structure
      baseFeeMinor: { type: Number, default: 0 },
      processingFeeMinor: { type: Number, default: 0 },
      processingFeeBps: { type: Number },
      campaignType: {
        type: String,
        enum: ["individual", "organization"],
      },
      totalFeeMinor: { type: Number, default: 0 },
      // Legacy fields
      paymentFeeMinor: { type: Number, default: 0 },
      platformFeeMinor: { type: Number, default: 0 },
    },
    totalChargedMinor: { type: Number, default: null },
    campaignReceivesMinor: { type: Number, default: null },
    donorCoversFee: { type: Boolean, default: false },
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
