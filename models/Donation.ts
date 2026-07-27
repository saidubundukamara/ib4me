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

/**
 * LEGACY, read-only history. Written by the old "fees added on top" model, where the
 * donor paid `amount + fees` and the campaign received the full `amount`.
 *
 * Do not write these on new donations and do not repurpose the names — `platformFeeMinor`
 * here means "platform + Monime, added on top", so feeding an old row into a new reader
 * would silently mean something different. New code reads `settlement`; the backfill and
 * the analytics fallbacks are the only things that should still read this block.
 */
export interface IDonationFees {
  baseFeeMinor?: number;           // The ASSUMED Monime 1% — never the reported one
  processingFeeMinor?: number;     // Percentage-based processing fee
  processingFeeBps?: number;       // Rate applied (for audit trail)
  campaignType?: "individual" | "organization";  // Type at time of donation
  totalFeeMinor?: number;          // baseFeeMinor + processingFeeMinor
  paymentFeeMinor?: number;        // Monime's reported fee — recorded, then never read
  platformFeeMinor?: number;
}

/**
 * The ESTIMATE, written at donation creation.
 *
 * Monime's fee isn't known until settlement, and the platform fee is a percentage of what
 * arrives after it — so everything shown to the donor before payment is necessarily
 * approximate. This block is what the donate page quoted, kept so we can show the donor
 * the same numbers on their receipt and explain any difference.
 *
 * `platformFeeBps` is the load-bearing field: settlement reuses THIS rate, not whatever
 * the admin has configured by then, so a fee change between donating and settling cannot
 * move the goalposts (MONIME-FEE-MODEL.md R4/R10).
 */
export interface IDonationQuote {
  grossMinor: number;
  monimeFeeBpsEstimate: number;
  monimeFeeMinorEstimate: number;
  platformFeeBps: number;
  platformFeeMinorEstimate: number;
  campaignReceivesMinorEstimate: number;
}

/**
 * The AUTHORITATIVE split, computed once at settlement and then frozen.
 *
 * Every downstream figure — the campaign's raised total, the internal transfer amount,
 * the ledger postings, the refund reversal — reads from here and never recomputes. That
 * is what keeps the money moved equal to the money booked (R14), and what makes a retry
 * safe after a fee-setting change (R10).
 */
export interface IDonationSettlement {
  grossMinor: number;               // What the donor was charged
  monimeFeeMinor: number;           // What Monime kept before we saw the money
  monimeFeeSource: "reported" | "estimated";
  arrivedMinor: number;             // gross − monimeFee: what physically landed
  platformFeeBps: number;           // The rate actually applied
  platformFeeMinor: number;         // Our cut
  campaignReceivesMinor: number;    // arrived − platformFee

  monimePaymentId?: string;         // Monime's `spm-…` id — the PER-CAPTURE correction key (R6)
  financialTransactionReference?: string;  // Reconciliation key
  channelReference?: string;               // MNO reference — reconciliation key

  appliedAt?: Date;
  correctedAt?: Date;               // Set when a late-arriving reported fee amended the split
  /**
   * True once the internal transfer has completed. After that the money has physically
   * moved at these numbers, so a late fee correction must NOT rewrite them — it books a
   * variance against the platform account instead (R14).
   */
  frozen?: boolean;
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
  amount: IDonationAmount;                    // What the donor entered — and, since fees
                                              // are deducted rather than added, exactly
                                              // what they are charged
  totalChargedMinor?: number | null;          // Kept for existing readers; equals amount.minor
  /** Mirror of `settlement.campaignReceivesMinor`, for the many readers that use it. */
  campaignReceivesMinor?: number | null;
  /** LEGACY. The "donor covers the fee" mode was removed; only old rows carry `true`. */
  donorCoversFee?: boolean;
  fx?: IDonationFx | null;
  provider: IDonationProvider;
  status: "pending" | "payment_received" | "succeeded" | "failed" | "refunded";
  quote?: IDonationQuote | null;              // Estimate, written at creation
  settlement?: IDonationSettlement | null;    // Authoritative, written at settlement
  fees?: IDonationFees | null;                // LEGACY — see IDonationFees
  transfer?: IDonationTransfer | null;        // Internal transfer tracking
  netAmountMinor?: number | null;             // LEGACY — use campaignReceivesMinor
  receiptUrl?: string | null;
  notifiedAt?: Date | null;
  idempotencyKey?: string | null;
  failureReason?: string | null;
  completedAt?: Date | null;
  refundReason?: string | null;
  refundedBy?: mongoose.Types.ObjectId | null;
  refundedAt?: Date | null;
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
    quote: {
      grossMinor: { type: Number },
      monimeFeeBpsEstimate: { type: Number },
      monimeFeeMinorEstimate: { type: Number },
      platformFeeBps: { type: Number },
      platformFeeMinorEstimate: { type: Number },
      campaignReceivesMinorEstimate: { type: Number },
    },
    settlement: {
      grossMinor: { type: Number },
      monimeFeeMinor: { type: Number, default: 0 },
      monimeFeeSource: {
        type: String,
        enum: ["reported", "estimated"],
        default: "estimated",
      },
      arrivedMinor: { type: Number },
      platformFeeBps: { type: Number },
      platformFeeMinor: { type: Number, default: 0 },
      campaignReceivesMinor: { type: Number },
      monimePaymentId: { type: String },
      financialTransactionReference: { type: String },
      channelReference: { type: String },
      appliedAt: { type: Date },
      correctedAt: { type: Date },
      frozen: { type: Boolean, default: false },
    },
    // LEGACY fee block — see IDonationFees. Not written for new donations.
    fees: {
      baseFeeMinor: { type: Number, default: 0 },
      processingFeeMinor: { type: Number, default: 0 },
      processingFeeBps: { type: Number },
      campaignType: {
        type: String,
        enum: ["individual", "organization"],
      },
      totalFeeMinor: { type: Number, default: 0 },
      paymentFeeMinor: { type: Number, default: 0 },
      platformFeeMinor: { type: Number, default: 0 },
    },
    totalChargedMinor: { type: Number, default: null },
    campaignReceivesMinor: { type: Number, default: null },
    donorCoversFee: { type: Boolean, default: false },
    netAmountMinor: { type: Number, default: null },
    receiptUrl: { type: String, default: null },
    notifiedAt: { type: Date, default: null },
    idempotencyKey: { type: String, default: null },
    failureReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
    refundReason: { type: String, default: null },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

donationSchema.index({ campaignId: 1, status: 1, createdAt: -1 });

/**
 * A double-submitted donate form used to create two pending donations and two checkout
 * sessions. Unique on the key stops that.
 *
 * `partialFilterExpression` rather than `sparse`: the field has always defaulted to
 * `null`, so existing rows carry explicit nulls, and a sparse unique index only skips
 * *missing* fields — every one of those nulls would collide and the index would fail to
 * build. Filtering on `$type: "string"` indexes only real keys.
 */
donationSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

/** Lookup key for the late-fee correction path (R6) — one payment capture, one id. */
donationSchema.index(
  { "settlement.monimePaymentId": 1 },
  { partialFilterExpression: { "settlement.monimePaymentId": { $type: "string" } } }
);

export default mongoose.models.Donation ||
  mongoose.model<IDonation>("Donation", donationSchema);
