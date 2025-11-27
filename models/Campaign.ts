import mongoose from "mongoose";

export interface ICampaignPatient {
  name: string;
  age?: number;
  photoAssetId?: mongoose.Types.ObjectId;
}

export interface ICampaignGoal {
  currency: string;
  amountMinor: number;
}

export interface ICampaignDocument {
  type: string;
  assetId: mongoose.Types.ObjectId;
}

export interface ICampaignVerification {
  status: "pending" | "under_review" | "approved" | "rejected";
  verifiedBy?: mongoose.Types.ObjectId | null;
  verifiedAt?: Date | null;
  hospitalVerified?: boolean;
}

export interface ICampaignOutcomeNextOfKin {
  name?: string;
  relation?: string;
  contact?: string;
  payoutDecision?: string;
}

export interface ICampaignOutcome {
  status?: "ongoing" | "recovered" | "deceased" | "completed";
  date?: Date | null;
  nextOfKin?: ICampaignOutcomeNextOfKin;
}

export interface ICampaignTotals {
  raisedMinor: number;
  donationCount: number;
  uniqueDonorCount?: number;
  lastDonationAt?: Date | null;
}

export interface ICampaignWithdrawals {
  totalPaidMinor: number;
  count: number;
}

export interface ICampaignFinancialAccount {
  id: string;
  uvan: string;
}

export interface ICampaignFlags {
  featured?: boolean;
  adminVerified?: boolean;
}

export interface ICampaignOwnerVerification {
  verified: boolean;
  verifiedAt?: Date | null;
  status: "not_started" | "pending" | "under_review" | "approved" | "rejected";
}

export interface ICampaign extends mongoose.Document {
  ownerId: mongoose.Types.ObjectId;
  slug: string;
  patient?: ICampaignPatient;
  diagnosis?: string;
  hospital?: {
    hospitalId?: mongoose.Types.ObjectId;
    name?: string;
  };
  goal?: ICampaignGoal;
  story?: string;
  documents?: ICampaignDocument[];
  verification?: ICampaignVerification;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  outcome?: ICampaignOutcome;
  urgency?: "low" | "medium" | "high";
  typeOfEmergency?: string;
  category?: string;
  categoryId?: mongoose.Types.ObjectId;
  share?: { whatsAppPostId?: string | null };
  totals?: ICampaignTotals;
  withdrawals?: ICampaignWithdrawals;
  financial_account?: ICampaignFinancialAccount;
  flags?: ICampaignFlags;
  ownerVerification?: ICampaignOwnerVerification;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new mongoose.Schema<ICampaign>(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    patient: {
      name: { type: String, trim: true },
      age: { type: Number, min: 0 },
      photoAssetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    },
    diagnosis: { type: String },
    hospital: {
      hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
      name: { type: String, trim: true },
    },
    goal: {
      currency: { type: String, trim: true },
      amountMinor: { type: Number, min: 0 },
    },
    story: { type: String },
    documents: [
      {
        type: { type: String, required: true },
        assetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MediaAsset",
          required: true,
        },
      },
    ],
    verification: {
      status: {
        type: String,
        enum: ["pending", "under_review", "approved", "rejected"],
        default: "pending",
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      verifiedAt: { type: Date, default: null },
      hospitalVerified: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "archived"],
      default: "draft",
      index: true,
    },
    outcome: {
      status: {
        type: String,
        enum: ["ongoing", "recovered", "deceased", "completed"],
        default: "ongoing",
      },
      date: { type: Date, default: null },
      nextOfKin: {
        name: { type: String },
        relation: { type: String },
        contact: { type: String },
        payoutDecision: { type: String },
      },
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    typeOfEmergency: { type: String },
    category: { type: String, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    share: {
      whatsAppPostId: { type: String, default: null },
    },
    totals: {
      raisedMinor: { type: Number, default: 0, min: 0 },
      donationCount: { type: Number, default: 0, min: 0 },
      uniqueDonorCount: { type: Number, default: 0, min: 0 },
      lastDonationAt: { type: Date, default: null },
    },
    withdrawals: {
      totalPaidMinor: { type: Number, default: 0, min: 0 },
      count: { type: Number, default: 0, min: 0 },
    },
    financial_account: {
      id: { type: String },
      uvan: { type: String },
    },
    flags: {
      featured: { type: Boolean, default: false },
      adminVerified: { type: Boolean, default: false },
    },
    ownerVerification: {
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ["not_started", "pending", "under_review", "approved", "rejected"],
        default: "not_started",
      },
    },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

campaignSchema.index({ slug: 1 }, { unique: true });
campaignSchema.index({ ownerId: 1, status: 1 });
campaignSchema.index({ "verification.status": 1 });

export default mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", campaignSchema);
