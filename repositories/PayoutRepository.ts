import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import Payout, { IPayout } from "../models/Payout";

export interface PayoutFilters {
  status?: IPayout["status"] | "all";
  method?: "mobile_money" | "bank" | "all";
  campaignId?: mongoose.Types.ObjectId;
  requestedBy?: mongoose.Types.ObjectId;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  requiresApproval?: boolean;
}

export interface PayoutListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

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

  // Admin-specific methods
  async listForAdmin(
    filters: PayoutFilters = {},
    options: PayoutListOptions = {}
  ): Promise<{
    payouts: IPayout[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = options;

    // Build query filter
    const query: Record<string, unknown> = {};
    
    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }
    
    if (filters.method && filters.method !== "all") {
      query["method.type"] = filters.method;
    }
    
    if (filters.campaignId) {
      query.campaignId = filters.campaignId;
    }
    
    if (filters.requestedBy) {
      query.requestedBy = filters.requestedBy;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }
    
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      query.amountMinor = {};
      if (filters.amountMin !== undefined) (query.amountMinor as Record<string, unknown>).$gte = filters.amountMin * 100;
      if (filters.amountMax !== undefined) (query.amountMinor as Record<string, unknown>).$lte = filters.amountMax * 100;
    }

    if (filters.requiresApproval) {
      query.status = { $in: ["processing", "in_review"] };
    }
    
    if (filters.search) {
      query.$or = [
        { "method.accountName": { $regex: filters.search, $options: "i" } },
        { "method.accountNumber": { $regex: filters.search, $options: "i" } },
        { "method.msisdn": { $regex: filters.search, $options: "i" } },
        { monimePayoutId: { $regex: filters.search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.findMany(query as never, {
        query: { sort, skip, limit }
      } as any),
      this.count(query as never)
    ]);

    return {
      payouts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAnalyticsByDateRange(dateFrom?: Date, dateTo?: Date): Promise<{
    totalPayouts: number;
    totalAmount: number;
    completedPayouts: number;
    completedAmount: number;
    pendingPayouts: number;
    pendingAmount: number;
    failedPayouts: number;
    failedAmount: number;
    averagePayout: number;
    successRate: number;
  }> {
    const matchStage: Record<string, unknown> = {};
    
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) (matchStage.createdAt as Record<string, unknown>).$gte = dateFrom;
      if (dateTo) (matchStage.createdAt as Record<string, unknown>).$lte = dateTo;
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          totalAmount: { $sum: "$amountMinor" },
          completedPayouts: {
            $sum: { $cond: [{ $in: ["$status", ["completed", "paid"]] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $in: ["$status", ["completed", "paid"]] }, "$amountMinor", 0] }
          },
          pendingPayouts: {
            $sum: { $cond: [{ $in: ["$status", ["processing", "in_review", "approved"]] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $in: ["$status", ["processing", "in_review", "approved"]] }, "$amountMinor", 0] }
          },
          failedPayouts: {
            $sum: { $cond: [{ $in: ["$status", ["failed", "rejected", "cancelled"]] }, 1, 0] }
          },
          failedAmount: {
            $sum: { $cond: [{ $in: ["$status", ["failed", "rejected", "cancelled"]] }, "$amountMinor", 0] }
          }
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    const data = result[0] || {
      totalPayouts: 0,
      totalAmount: 0,
      completedPayouts: 0,
      completedAmount: 0,
      pendingPayouts: 0,
      pendingAmount: 0,
      failedPayouts: 0,
      failedAmount: 0
    };

    const averagePayout = data.totalPayouts > 0 ? data.totalAmount / data.totalPayouts : 0;
    const successRate = data.totalPayouts > 0 ? (data.completedPayouts / data.totalPayouts) * 100 : 0;

    return {
      ...data,
      averagePayout,
      successRate
    };
  }

  async getMethodBreakdown(dateFrom?: Date, dateTo?: Date): Promise<Array<{
    method: string;
    count: number;
    amount: number;
    successRate: number;
  }>> {
    const matchStage: Record<string, unknown> = {};
    
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) (matchStage.createdAt as Record<string, unknown>).$gte = dateFrom;
      if (dateTo) (matchStage.createdAt as Record<string, unknown>).$lte = dateTo;
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$method.type",
          count: { $sum: 1 },
          amount: { $sum: "$amountMinor" },
          successCount: {
            $sum: { $cond: [{ $in: ["$status", ["completed", "paid"]] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          method: "$_id",
          count: 1,
          amount: 1,
          successRate: {
            $cond: [
              { $gt: ["$count", 0] },
              { $multiply: [{ $divide: ["$successCount", "$count"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { amount: -1 as -1 } }
    ];

    return this.model.aggregate(pipeline);
  }

  async getTopCampaignsByPayouts(limit: number = 10): Promise<Array<{
    campaignId: string;
    campaignName: string;
    totalAmount: number;
    payoutCount: number;
    lastPayout: Date;
  }>> {
    const pipeline = [
      { $match: { status: { $in: ["completed", "paid"] } } },
      {
        $group: {
          _id: "$campaignId",
          totalAmount: { $sum: "$amountMinor" },
          payoutCount: { $sum: 1 },
          lastPayout: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "_id",
          foreignField: "_id",
          as: "campaign"
        }
      },
      { $unwind: "$campaign" },
      {
        $project: {
          campaignId: "$_id",
          campaignName: {
            $ifNull: ["$campaign.beneficiary.name", "$campaign.details"]
          },
          totalAmount: 1,
          payoutCount: 1,
          lastPayout: 1
        }
      },
      { $sort: { totalAmount: -1 as -1 } },
      { $limit: limit }
    ];

    return this.model.aggregate(pipeline);
  }

  async getPendingApprovals(): Promise<IPayout[]> {
    return this.findMany({ 
      status: { $in: ["processing", "in_review"] } 
    } as never, {
      query: { sort: { createdAt: 1 } }
    } as any);
  }

  async getPayoutsByStatus(): Promise<Array<{
    status: string;
    count: number;
    amount: number;
  }>> {
    const pipeline = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amountMinor" }
        }
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          amount: 1
        }
      },
      { $sort: { count: -1 as -1 } }
    ];

    return this.model.aggregate(pipeline);
  }
}

export const payoutRepository = new PayoutRepository();
