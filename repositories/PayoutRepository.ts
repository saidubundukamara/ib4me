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
}

export const payoutRepository = new PayoutRepository();
