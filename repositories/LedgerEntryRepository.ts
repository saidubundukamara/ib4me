import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import LedgerEntry, {
  ILedgerEntry,
  LedgerRefType,
} from "../models/LedgerEntry";

export class LedgerEntryRepository extends BaseRepository<ILedgerEntry> {
  constructor() {
    super(LedgerEntry);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<ILedgerEntry[]> {
    return this.findMany({ campaignId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }

  async listByRef(
    refType: LedgerRefType,
    refId: mongoose.Types.ObjectId
  ): Promise<ILedgerEntry[]> {
    return this.findMany({ refType, refId } as never, {
      query: { sort: { createdAt: -1 } },
    });
  }
}

export const ledgerEntryRepository = new LedgerEntryRepository();
