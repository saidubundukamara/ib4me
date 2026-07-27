import mongoose from "mongoose";

export interface IPayoutMethodMobileMoney {
  type: "mobile_money";
  provider?: string;
  msisdn?: string;
  accountName?: string;
}

export interface IPayoutMethodBank {
  type: "bank";
  providerId?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface IPayoutApproval {
  adminId: mongoose.Types.ObjectId;
  action: "approved" | "rejected" | "requested";
  note?: string;
  at: Date;
}

export interface IPayoutPolicyCheck {
  minThresholdMet?: boolean;
  overrideBy?: mongoose.Types.ObjectId | null;
}

export interface IPayout extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  /** What was requested. This FULL amount leaves the campaign's balance. */
  amountMinor: number;
  currency: string;
  /**
   * What Monime kept out of `amountMinor`. Written at COMPLETION from the fee Monime
   * actually reported — at request time it is only an estimate, and telling a campaign
   * owner a number they will not receive is the bug this field exists to prevent (R12).
   *
   * Deliberately a column and not a ledger account: the fee was never platform money, it
   * comes out of a balance the campaign already owned (R7).
   */
  feeMinor: number;
  /** What actually reached the owner's wallet: amountMinor − feeMinor. */
  netAmountMinor: number;
  feeSource: "reported" | "estimated";
  /** The fee we showed the owner when they confirmed, kept for dispute handling. */
  quotedFeeMinor: number;
  method: IPayoutMethodMobileMoney | IPayoutMethodBank;
  status: "processing" | "completed" | "failed" | "cancelled" | "in_review" | "approved" | "rejected" | "paid" | "threshold_review";
  monimePayoutId?: string;
  approvals?: IPayoutApproval[];
  policyCheck?: IPayoutPolicyCheck;
  paymentProofUrl?: string | null;
  failureReason?: string;
  /** Guard so the "on completed" side-effects (campaign withdrawal counters +
   *  ledger entry) are applied exactly once, whether the synchronous disburse
   *  response or the payout.completed webhook gets there first. */
  completionApplied?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new mongoose.Schema<IPayout>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountMinor: { type: Number, required: true, min: 0 },
    // Written at request time from the campaign's own currency. Previously a `"UGX"`
    // literal was hardcoded into the payout ledger entry on a Sierra Leone platform.
    currency: { type: String, default: "SLE" },
    feeMinor: { type: Number, default: 0 },
    netAmountMinor: { type: Number, default: 0 },
    feeSource: {
      type: String,
      enum: ["reported", "estimated"],
      default: "estimated",
    },
    quotedFeeMinor: { type: Number, default: 0 },
    method: {
      type: {
        type: String,
        enum: ["mobile_money", "bank"],
        required: true,
      },
      provider: { type: String },
      providerId: { type: String },
      msisdn: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed", "cancelled", "in_review", "approved", "rejected", "paid", "threshold_review"],
      default: "processing",
      index: true,
    },
    monimePayoutId: { type: String },
    approvals: [
      {
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        action: {
          type: String,
          enum: ["approved", "rejected", "requested"],
          required: true,
        },
        note: { type: String },
        at: { type: Date, required: true },
      },
    ],
    policyCheck: {
      minThresholdMet: { type: Boolean },
      overrideBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    paymentProofUrl: { type: String, default: null },
    failureReason: { type: String },
    completionApplied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * One Monime payout, one row. Backstop against a retried disbursement being recorded
 * twice — the deterministic `payout_${id}` idempotency key sent to Monime is the primary
 * defence, this catches anything that slips past it.
 */
payoutSchema.index(
  { monimePayoutId: 1 },
  { unique: true, partialFilterExpression: { monimePayoutId: { $type: "string" } } }
);

export default mongoose.models.Payout ||
  mongoose.model<IPayout>("Payout", payoutSchema);
