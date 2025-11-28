import mongoose from "mongoose";

export type PartnerType = "corporate" | "healthcare" | "ngo";
export type PartnerStatus = "active" | "inactive";

export interface IPartner extends mongoose.Document {
  name: string;
  logoAssetId?: mongoose.Types.ObjectId | null;
  website?: string | null;
  partnerType: PartnerType;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const partnerSchema = new mongoose.Schema<IPartner>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    logoAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },
    website: { type: String, default: null, trim: true },
    partnerType: {
      type: String,
      enum: ["corporate", "healthcare", "ngo"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

partnerSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Partner ||
  mongoose.model<IPartner>("Partner", partnerSchema);
