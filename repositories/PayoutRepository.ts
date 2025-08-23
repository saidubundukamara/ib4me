import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import Payout, { IPayout } from "../models/Payout";

export class PayoutRepository extends BaseRepository<IPayout> {
  constructor() {
    super(Payout);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IPayout[]> {
    return this.findMany({ campaignId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async listByCampaignIds(
    campaignIds: mongoose.Types.ObjectId[]
  ): Promise<IPayout[]> {
    if (campaignIds.length === 0) return [];
    return this.findMany({ campaignId: { $in: campaignIds } } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async listRecentByCampaignIds(
    campaignIds: mongoose.Types.ObjectId[],
    limit: number
  ): Promise<IPayout[]> {
    if (campaignIds.length === 0) return [];
    return this.findMany({ campaignId: { $in: campaignIds } } as never, {
      query: { sort: { createdAt: -1 }, limit },
    });
  }
}

export const payoutRepository = new PayoutRepository();
