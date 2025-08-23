import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import Donation, { IDonation } from "../models/Donation";

export class DonationRepository extends BaseRepository<IDonation> {
  constructor() {
    super(Donation);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IDonation[]> {
    return this.findMany({ campaignId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async findByIdempotencyKey(key: string): Promise<IDonation | null> {
    return this.findOne({ idempotencyKey: key } as never);
  }

  async listSucceededByCampaignIds(
    campaignIds: mongoose.Types.ObjectId[]
  ): Promise<IDonation[]> {
    if (campaignIds.length === 0) return [];
    return this.findMany(
      {
        campaignId: { $in: campaignIds },
        status: "succeeded",
      } as never,
      { query: { sort: { createdAt: -1 } } }
    );
  }

  async listRecentSucceededByCampaignIds(
    campaignIds: mongoose.Types.ObjectId[],
    limit: number
  ): Promise<IDonation[]> {
    if (campaignIds.length === 0) return [];
    return this.findMany(
      {
        campaignId: { $in: campaignIds },
        status: "succeeded",
      } as never,
      { query: { sort: { createdAt: -1 }, limit } }
    );
  }

  async listByDonor(donorId: mongoose.Types.ObjectId): Promise<IDonation[]> {
    return this.findMany({ donorId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async listSucceededByDonor(
    donorId: mongoose.Types.ObjectId
  ): Promise<IDonation[]> {
    return this.findMany({ donorId, status: "succeeded" } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async listRecentSucceededByDonor(
    donorId: mongoose.Types.ObjectId,
    limit: number
  ): Promise<IDonation[]> {
    return this.findMany({ donorId, status: "succeeded" } as never, {
      query: { sort: { createdAt: -1 }, limit },
    });
  }
}

export const donationRepository = new DonationRepository();
