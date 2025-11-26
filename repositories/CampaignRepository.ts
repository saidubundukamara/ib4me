import mongoose from "mongoose";
import { BaseRepository, RepositorySession } from "./BaseRepository";
import Campaign, { ICampaign } from "../models/Campaign";

export class CampaignRepository extends BaseRepository<ICampaign> {
  constructor() {
    super(Campaign);
  }

  async findBySlug(slug: string): Promise<ICampaign | null> {
    return this.findOne({ slug } as never);
  }

  async listByOwner(ownerId: mongoose.Types.ObjectId): Promise<ICampaign[]> {
    return this.findMany({ ownerId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async listByStatus(status: ICampaign["status"]): Promise<ICampaign[]> {
    return this.findMany({ status } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async updateTotals(
    campaignId: string,
    totals: NonNullable<ICampaign["totals"]>,
    session?: RepositorySession
  ): Promise<ICampaign | null> {
    return this.updateById(campaignId, { $set: { totals } } as never, session);
  }

  /**
   * Count active and approved campaigns for a given owner.
   * "Active" = status="active" AND verification.status="approved"
   */
  async countActiveApprovedByOwner(ownerId: mongoose.Types.ObjectId): Promise<number> {
    return this.count({
      ownerId,
      status: "active",
      "verification.status": "approved"
    } as never);
  }
}

export const campaignRepository = new CampaignRepository();
