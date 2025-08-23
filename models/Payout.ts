import mongoose from "mongoose";

export interface IPayoutMethodMobileMoney {
  type: "mobile_money";
  provider?: string;
  msisdn?: string;
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
  method: IPayoutMethodMobileMoney;
  status: "in_review" | "approved" | "rejected" | "paid";
  approvals?: IPayoutApproval[];
  policyCheck?: IPayoutPolicyCheck;
  paymentProofUrl?: string | null;
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
        enum: ["mobile_money"],
        required: true,
      },
      provider: { type: String },
      msisdn: { type: String },
      accountName: { type: String },
    },
    status: {
      type: String,
      enum: ["in_review", "approved", "rejected", "paid"],
      default: "in_review",
      index: true,
    },
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
  },
  { timestamps: true }
);

export default mongoose.models.Payout ||
  mongoose.model<IPayout>("Payout", payoutSchema);
