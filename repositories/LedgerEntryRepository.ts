import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import LedgerEntry, {
  ILedgerEntry,
  LedgerRefType,
  LedgerAccountType,
} from "../models/LedgerEntry";

export interface PlatformBalanceResult {
  totalIn: number;
  totalOut: number;
  balance: number;
}

export interface FeeRevenueResult {
  totalFees: number;
  count: number;
}

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

  async listByAccountType(
    accountType: LedgerAccountType,
    limit?: number
  ): Promise<ILedgerEntry[]> {
    return this.findMany({ accountType } as never, {
      query: { sort: { createdAt: -1 }, limit: limit || 100 },
    });
  }

  /**
   * Get the platform's current balance (total in - total out)
   */
  async getPlatformBalance(): Promise<PlatformBalanceResult> {
    const result = await LedgerEntry.aggregate([
      { $match: { accountType: "platform" } },
      {
        $group: {
          _id: null,
          totalIn: {
            $sum: { $cond: [{ $eq: ["$direction", "in"] }, "$amountMinor", 0] },
          },
          totalOut: {
            $sum: { $cond: [{ $eq: ["$direction", "out"] }, "$amountMinor", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalIn: 1,
          totalOut: 1,
          balance: { $subtract: ["$totalIn", "$totalOut"] },
        },
      },
    ]);
    return result[0] || { totalIn: 0, totalOut: 0, balance: 0 };
  }

  /**
   * Get total fee revenue collected by the platform
   */
  async getFeeRevenue(dateFrom?: Date, dateTo?: Date): Promise<FeeRevenueResult> {
    const match: Record<string, unknown> = { refType: "platform_fee" };
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) (match.createdAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (match.createdAt as Record<string, Date>).$lte = dateTo;
    }

    const result = await LedgerEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$amountMinor" },
          count: { $sum: 1 },
        },
      },
    ]);
    return result[0] || { totalFees: 0, count: 0 };
  }

  /**
   * Get campaign balance from ledger entries
   */
  async getCampaignBalance(campaignId: mongoose.Types.ObjectId): Promise<PlatformBalanceResult> {
    const result = await LedgerEntry.aggregate([
      { $match: { campaignId, accountType: "campaign" } },
      {
        $group: {
          _id: null,
          totalIn: {
            $sum: { $cond: [{ $eq: ["$direction", "in"] }, "$amountMinor", 0] },
          },
          totalOut: {
            $sum: { $cond: [{ $eq: ["$direction", "out"] }, "$amountMinor", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalIn: 1,
          totalOut: 1,
          balance: { $subtract: ["$totalIn", "$totalOut"] },
        },
      },
    ]);
    return result[0] || { totalIn: 0, totalOut: 0, balance: 0 };
  }
}

export const ledgerEntryRepository = new LedgerEntryRepository();
