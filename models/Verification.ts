import mongoose from "mongoose";

export interface IKycDocuments {
  idDocument?: mongoose.Types.ObjectId | null;
  addressProof?: mongoose.Types.ObjectId | null;
}

export interface IKybDocuments {
  registrationCertificate?: mongoose.Types.ObjectId | null;
  representativeId?: mongoose.Types.ObjectId | null;
  addressProof?: mongoose.Types.ObjectId | null;
  taxCertificate?: mongoose.Types.ObjectId | null;
}

export interface IVerification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: "kyc" | "kyb";
  status: "not_started" | "pending" | "under_review" | "approved" | "rejected";
  submittedAt?: Date | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  kycDocuments?: IKycDocuments | null;
  kybDocuments?: IKybDocuments | null;
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new mongoose.Schema<IVerification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["kyc", "kyb"],
      required: true,
    },
    status: {
      type: String,
      enum: ["not_started", "pending", "under_review", "approved", "rejected"],
      default: "not_started",
      index: true,
    },
    submittedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    kycDocuments: {
      idDocument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
      addressProof: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
    },
    kybDocuments: {
      registrationCertificate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
      representativeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
      addressProof: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
      taxCertificate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Unique index: one verification record per user
verificationSchema.index({ userId: 1 }, { unique: true });
verificationSchema.index({ type: 1, status: 1 });

export default mongoose.models.Verification ||
  mongoose.model<IVerification>("Verification", verificationSchema);
