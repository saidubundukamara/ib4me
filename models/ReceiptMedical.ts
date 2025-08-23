import mongoose from "mongoose";

export interface IReceiptMedical extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  fileAssetId: mongoose.Types.ObjectId;
  amountMinor: number;
  vendor: string;
  date: Date;
  description?: string | null;
  verifiedBy?: mongoose.Types.ObjectId | null;
  approved?: boolean;
  createdAt: Date;
}

const receiptMedicalSchema = new mongoose.Schema<IReceiptMedical>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    fileAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      required: true,
    },
    amountMinor: { type: Number, required: true, min: 0 },
    vendor: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, default: null },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approved: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.ReceiptMedical ||
  mongoose.model<IReceiptMedical>("ReceiptMedical", receiptMedicalSchema);
