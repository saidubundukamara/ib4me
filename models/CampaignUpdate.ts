import mongoose from "mongoose";

export interface ICampaignUpdate extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  media?: { assetId: mongoose.Types.ObjectId }[];
  isPublic: boolean;
  createdAt: Date;
}

const campaignUpdateSchema = new mongoose.Schema<ICampaignUpdate>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    media: [
      {
        assetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MediaAsset",
          required: true,
        },
      },
    ],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.CampaignUpdate ||
  mongoose.model<ICampaignUpdate>("CampaignUpdate", campaignUpdateSchema);
