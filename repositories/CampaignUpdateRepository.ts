import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import CampaignUpdate, { ICampaignUpdate } from "../models/CampaignUpdate";

export class CampaignUpdateRepository extends BaseRepository<ICampaignUpdate> {
  constructor() {
    super(CampaignUpdate);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<ICampaignUpdate[]> {
    return this.findMany({ campaignId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }
}

export const campaignUpdateRepository = new CampaignUpdateRepository();
