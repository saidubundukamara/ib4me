import mongoose from "mongoose";
import { campaignRepository } from "../repositories";
import { ICampaign } from "../models/Campaign";

export class CampaignService {
  async getBySlug(slug: string): Promise<ICampaign | null> {
    return campaignRepository.findBySlug(slug);
  }

  async listByOwner(ownerId: mongoose.Types.ObjectId): Promise<ICampaign[]> {
    return campaignRepository.listByOwner(ownerId);
  }

  async listActive(): Promise<ICampaign[]> {
    return campaignRepository.listByStatus("active");
  }
}

export const campaignService = new CampaignService();
