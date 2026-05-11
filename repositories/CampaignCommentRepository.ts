import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import CampaignComment, { ICampaignComment } from "../models/CampaignComment";

export class CampaignCommentRepository extends BaseRepository<ICampaignComment> {
  constructor() {
    super(CampaignComment);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId,
    limit = 50
  ): Promise<ICampaignComment[]> {
    return this.findMany({ campaignId, isApproved: true } as never, {
      query: { sort: { createdAt: -1 }, limit },
    });
  }
}

export const campaignCommentRepository = new CampaignCommentRepository();
