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
  amountMinor: number;
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
    monimePayoutId: { type: String, sparse: true },
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

export default mongoose.models.Payout ||
  mongoose.model<IPayout>("Payout", payoutSchema);
