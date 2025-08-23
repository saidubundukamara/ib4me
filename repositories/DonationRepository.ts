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
}

export const donationRepository = new DonationRepository();
