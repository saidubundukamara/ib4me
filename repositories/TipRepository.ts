import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import Tip, { ITip } from "../models/Tip";

export interface TipFilters {
  status?: ITip["status"] | "all";
  tipperId?: mongoose.Types.ObjectId;
  isAnonymous?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

export interface TipListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class TipRepository extends BaseRepository<ITip> {
  constructor() {
    super(Tip);
  }

  async findByIdempotencyKey(key: string): Promise<ITip | null> {
    await this.ensureConnection();
    return this.findOne({ idempotencyKey: key } as never);
  }

  async listForAdmin(
    filters: TipFilters = {},
    options: TipListOptions = {}
  ): Promise<{
    tips: ITip[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    await this.ensureConnection();

    const {
      status,
      tipperId,
      isAnonymous,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      search,
    } = filters;

    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options;

    // Build match stage
    const matchStage: Record<string, unknown> = {};

    if (status && status !== "all") {
      matchStage.status = status;
    }

    if (tipperId) {
      matchStage.tipperId = tipperId;
    }

    if (typeof isAnonymous === "boolean") {
      matchStage.isAnonymous = isAnonymous;
    }

    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) {
        (matchStage.createdAt as Record<string, Date>).$gte = dateFrom;
      }
      if (dateTo) {
        (matchStage.createdAt as Record<string, Date>).$lte = dateTo;
      }
    }

    if (amountMin !== undefined || amountMax !== undefined) {
      matchStage["amount.minor"] = {};
      if (amountMin !== undefined) {
        (matchStage["amount.minor"] as Record<string, number>).$gte = amountMin;
      }
      if (amountMax !== undefined) {
        (matchStage["amount.minor"] as Record<string, number>).$lte = amountMax;
      }
    }

    if (search) {
      matchStage.$or = [
        { "tipperSnapshot.name": { $regex: search, $options: "i" } },
        { "tipperSnapshot.email": { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Count total
    const total = await this.model.countDocuments(matchStage);
    const totalPages = Math.ceil(total / limit);

    // Fetch tips
    const tips = await this.model
      .find(matchStage)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      tips,
      total,
      page,
      totalPages,
    };
  }

  async getAnalytics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalTips: number;
    totalAmount: number;
    successfulTips: number;
    successfulAmount: number;
    averageTip: number;
    successRate: number;
  }> {
    await this.ensureConnection();

    const matchStage: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) {
        (matchStage.createdAt as Record<string, Date>).$gte = dateFrom;
      }
      if (dateTo) {
        (matchStage.createdAt as Record<string, Date>).$lte = dateTo;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTips: { $sum: 1 },
          totalAmount: { $sum: "$amount.minor" },
          successfulTips: {
            $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] },
          },
          successfulAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "succeeded"] }, "$amount.minor", 0],
            },
          },
        },
      },
    ];

    const results = await this.model.aggregate(pipeline);

    if (results.length === 0) {
      return {
        totalTips: 0,
        totalAmount: 0,
        successfulTips: 0,
        successfulAmount: 0,
        averageTip: 0,
        successRate: 0,
      };
    }

    const data = results[0];
    return {
      totalTips: data.totalTips,
      totalAmount: data.totalAmount,
      successfulTips: data.successfulTips,
      successfulAmount: data.successfulAmount,
      averageTip:
        data.successfulTips > 0
          ? Math.round(data.successfulAmount / data.successfulTips)
          : 0,
      successRate:
        data.totalTips > 0
          ? Math.round((data.successfulTips / data.totalTips) * 100)
          : 0,
    };
  }

  async getTopTippers(
    limit: number = 10
  ): Promise<
    Array<{
      tipperName: string;
      tipperEmail?: string;
      totalAmount: number;
      tipCount: number;
      lastTip: Date;
      isAnonymous: boolean;
    }>
  > {
    await this.ensureConnection();

    const pipeline = [
      { $match: { status: "succeeded", isAnonymous: false } },
      {
        $group: {
          _id: "$tipperSnapshot.email",
          tipperName: { $first: "$tipperSnapshot.name" },
          tipperEmail: { $first: "$tipperSnapshot.email" },
          totalAmount: { $sum: "$amount.minor" },
          tipCount: { $sum: 1 },
          lastTip: { $max: "$createdAt" },
        },
      },
      { $sort: { totalAmount: -1 as const } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tipperName: { $ifNull: ["$tipperName", "Anonymous"] },
          tipperEmail: 1,
          totalAmount: 1,
          tipCount: 1,
          lastTip: 1,
          isAnonymous: { $literal: false },
        },
      },
    ];

    return this.model.aggregate(pipeline);
  }
}

export const tipRepository = new TipRepository();
