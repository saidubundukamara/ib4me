import mongoose from "mongoose";

export interface IStorageRef {
  provider: string;
  bucket?: string;
  key?: string;
}

export interface IMediaAsset extends mongoose.Document {
  ownerId?: mongoose.Types.ObjectId | null;
  campaignId?: mongoose.Types.ObjectId | null;
  type: string;
  storage: IStorageRef;
  url?: string | null;
  size?: number | null;
  checksum?: string | null;
  createdAt: Date;
}

const mediaAssetSchema = new mongoose.Schema<IMediaAsset>(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true,
    },
    type: { type: String, required: true },
    storage: {
      provider: { type: String, required: true },
      bucket: { type: String },
      key: { type: String },
    },
    url: { type: String, default: null },
    size: { type: Number, default: null },
    checksum: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.MediaAsset ||
  mongoose.model<IMediaAsset>("MediaAsset", mediaAssetSchema);
