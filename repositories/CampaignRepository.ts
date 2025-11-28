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

  /**
   * Update all campaigns owned by a user.
   * Used to sync ownerVerification when user completes KYC.
   */
  async updateManyByOwner(
    ownerId: mongoose.Types.ObjectId,
    update: Record<string, unknown>
  ): Promise<{ modifiedCount: number }> {
    const result = await this.model.updateMany(
      { ownerId },
      { $set: update }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * List public campaigns by owner ID.
   * Only returns active, approved campaigns visible to the public.
   */
  async listPublicByOwner(
    ownerId: mongoose.Types.ObjectId,
    options?: { limit?: number; page?: number }
  ): Promise<{ campaigns: ICampaign[]; total: number }> {
    await this.ensureConnection();

    const limit = options?.limit || 12;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const query = {
      ownerId,
      status: "active",
      "verification.status": "approved",
    };

    const [campaigns, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { campaigns, total };
  }
}

export const campaignRepository = new CampaignRepository();
