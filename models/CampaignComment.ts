import mongoose from "mongoose";

export interface ICampaignComment extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  authorName?: string | null;
  content: string;
  isApproved: boolean;
  createdAt: Date;
}

const campaignCommentSchema = new mongoose.Schema<ICampaignComment>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    authorName: { type: String, default: null, maxlength: 80 },
    content: { type: String, required: true, maxlength: 500 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.CampaignComment ||
  mongoose.model<ICampaignComment>("CampaignComment", campaignCommentSchema);
