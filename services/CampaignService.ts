import mongoose from "mongoose";
import { campaignRepository } from "../repositories";
import { ICampaign } from "../models/Campaign";
import { monimeService, MonimeFinancialAccountRequest } from "../lib/monime";
import { runInTransaction } from "./ServiceTransaction";

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

  async createCampaign(campaignData: Partial<ICampaign>): Promise<ICampaign> {
    return runInTransaction(async (session) => {
      // Create the campaign first
      const campaign = await campaignRepository.create(campaignData, session);
      
      // Create financial account with Monime
      const financialAccountRequest: MonimeFinancialAccountRequest = {
        name: `Campaign: ${campaign.slug}`,
        currency: campaign.goal?.currency || "SLE",
        reference: campaign.slug,
        description: `Financial account for campaign: ${campaign.patient?.name || campaign.diagnosis || campaign.slug}`,
      };
      
      try {
        const financialAccount = await monimeService.createFinancialAccount(
          financialAccountRequest,
          `campaign-${campaign._id}-${Date.now()}`
        );
        
        // Update campaign with financial account details
        const updatedCampaign = await campaignRepository.updateById(
          String(campaign._id),
          {
            $set: {
              financial_account: {
                id: financialAccount.id,
                uvan: financialAccount.uvan,
              },
            },
          },
          session
        );
        
        return updatedCampaign;
      } catch (error) {
        // Financial account creation failed - transaction will be rolled back
        throw new Error(`Failed to create financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
}

export const campaignService = new CampaignService();
