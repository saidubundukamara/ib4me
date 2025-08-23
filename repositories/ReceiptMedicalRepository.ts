import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import ReceiptMedical, { IReceiptMedical } from "../models/ReceiptMedical";

export class ReceiptMedicalRepository extends BaseRepository<IReceiptMedical> {
  constructor() {
    super(ReceiptMedical);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IReceiptMedical[]> {
    return this.findMany({ campaignId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }
}

export const receiptMedicalRepository = new ReceiptMedicalRepository();
