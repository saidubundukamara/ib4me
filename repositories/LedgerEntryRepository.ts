import mongoose from "mongoose";
import { BaseRepository, RepositorySession } from "./BaseRepository";
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
   * Post a ledger entry at most once, ever.
   *
   * Returns `true` if this call actually wrote the entry and `false` if an entry with the
   * same key already existed. Callers must use that answer: mirroring a figure onto a
   * donation or incrementing a counter unconditionally lets a replayed webhook claim the
   * same movement twice, even though the ledger correctly refused it
   * (MONIME-FEE-MODEL.md R6).
   *
   * Uniqueness is enforced by the index, not by a read-then-write, so two concurrent
   * webhook deliveries racing on the same key cannot both win.
   *
   * Zero-amount entries are silently skipped rather than written: a small donation can
   * floor its platform fee to zero, and the correct response is to post nothing (R5). The
   * caller still sees `false`, meaning "nothing moved".
   */
  async createIdempotent(
    entry: Partial<ILedgerEntry>,
    idempotencyKey: string,
    session?: RepositorySession
  ): Promise<boolean> {
    if (!entry.amountMinor || entry.amountMinor <= 0) return false;

    try {
      await this.create({ ...entry, idempotencyKey } as Partial<ILedgerEntry>, session);
      return true;
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) return false; // duplicate key
      throw error;
    }
  }

  /**
   * Net movement for one account type, as `in − out`.
   *
   * `platform`, `campaign` and `platform_tips` each correspond to a real Monime financial
   * account, so each balance is reconcilable against that account at zero tolerance.
   */
  async getBalanceByAccountType(
    accountType: LedgerAccountType
  ): Promise<PlatformBalanceResult> {
    const result = await LedgerEntry.aggregate([
      { $match: { accountType } },
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

  /** The platform fee/settlement account — NOT the tip account. */
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
