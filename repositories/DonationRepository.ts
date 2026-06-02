import mongoose from "mongoose";
import { BaseRepository } from "./BaseRepository";
import Donation, { IDonation } from "../models/Donation";

export interface DonationFilters {
  status?: IDonation["status"] | "all";
  provider?: string;
  campaignId?: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId;
  isAnonymous?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

export interface DonationListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class DonationRepository extends BaseRepository<IDonation> {
  constructor() {
    super(Donation);
  }

  /**
   * Find donation by ID with populated campaign and donor data
   * Used for admin views where full related data is needed
   */
  async findByIdWithCampaign(id: string): Promise<IDonation | null> {
    await this.ensureConnection();
    return this.model
      .findById(id)
      .populate({
        path: 'campaignId',
        select: '_id slug beneficiary details status'
      })
      .populate({
        path: 'donorId',
        select: '_id firstName lastName email'
      })
      .exec();
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

  async listByCampaignIds(
    campaignIds: mongoose.Types.ObjectId[]
  ): Promise<IDonation[]> {
    if (campaignIds.length === 0) return [];
    return this.findMany(
      {
        campaignId: { $in: campaignIds },
      } as never,
      { query: { sort: { createdAt: -1 } } }
    );
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

  // Admin-specific methods
  async listForAdmin(
    filters: DonationFilters = {},
    options: DonationListOptions = {}
  ): Promise<{
    donations: IDonation[];
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
    
    if (filters.provider) {
      query["provider.name"] = { $regex: filters.provider, $options: "i" };
    }
    
    if (filters.campaignId) {
      query.campaignId = filters.campaignId;
    }
    
    if (filters.donorId) {
      query.donorId = filters.donorId;
    }
    
    if (filters.isAnonymous !== undefined) {
      query.isAnonymous = filters.isAnonymous;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.dateTo as Record<string, unknown>).$lte = filters.dateTo;
    }
    
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      query["amount.minor"] = {};
      if (filters.amountMin !== undefined) (query["amount.minor"] as Record<string, unknown>).$gte = filters.amountMin * 100; // Convert to minor units
      if (filters.amountMax !== undefined) (query["amount.minor"] as Record<string, unknown>).$lte = filters.amountMax * 100; // Convert to minor units
    }
    
    if (filters.search) {
      query.$or = [
        { "donorSnapshot.name": { $regex: filters.search, $options: "i" } },
        { "donorSnapshot.email": { $regex: filters.search, $options: "i" } },
        { "provider.paymentId": { $regex: filters.search, $options: "i" } },
        { message: { $regex: filters.search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      this.findMany(query as never, {
        query: { sort, skip, limit }
      } as any),
      this.count(query as never)
    ]);

    return {
      donations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAnalyticsByDateRange(dateFrom?: Date, dateTo?: Date): Promise<{
    totalDonations: number;
    totalAmount: number;
    successfulDonations: number;
    successfulAmount: number;
    pendingDonations: number;
    pendingAmount: number;
    failedDonations: number;
    failedAmount: number;
    refundedDonations: number;
    refundedAmount: number;
    paymentReceivedDonations: number;
    paymentReceivedAmount: number;
    averageDonation: number;
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
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: "$amount.minor" },
          successfulDonations: {
            $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] }
          },
          successfulAmount: {
            $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, "$amount.minor", 0] }
          },
          pendingDonations: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount.minor", 0] }
          },
          failedDonations: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          failedAmount: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, "$amount.minor", 0] }
          },
          refundedDonations: {
            $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] }
          },
          refundedAmount: {
            $sum: { $cond: [{ $eq: ["$status", "refunded"] }, "$amount.minor", 0] }
          },
          paymentReceivedDonations: {
            $sum: { $cond: [{ $eq: ["$status", "payment_received"] }, 1, 0] }
          },
          paymentReceivedAmount: {
            $sum: { $cond: [{ $eq: ["$status", "payment_received"] }, "$amount.minor", 0] }
          }
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    const data = result[0] || {
      totalDonations: 0,
      totalAmount: 0,
      successfulDonations: 0,
      successfulAmount: 0,
      pendingDonations: 0,
      pendingAmount: 0,
      failedDonations: 0,
      failedAmount: 0,
      refundedDonations: 0,
      refundedAmount: 0,
      paymentReceivedDonations: 0,
      paymentReceivedAmount: 0
    };

    const averageDonation = data.totalDonations > 0 ? data.totalAmount / data.totalDonations : 0;
    const successRate = data.totalDonations > 0 ? (data.successfulDonations / data.totalDonations) * 100 : 0;

    return {
      ...data,
      averageDonation,
      successRate
    };
  }

  async getProviderBreakdown(dateFrom?: Date, dateTo?: Date): Promise<Array<{
    provider: string;
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
          _id: "$provider.name",
          count: { $sum: 1 },
          amount: { $sum: "$amount.minor" },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          provider: "$_id",
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

  async getTopDonors(limit: number = 10): Promise<Array<{
    donorName: string;
    donorEmail?: string;
    totalAmount: number;
    donationCount: number;
    lastDonation: Date;
    isAnonymous: boolean;
  }>> {
    const pipeline = [
      { $match: { status: "succeeded" } },
      {
        $group: {
          _id: {
            donorId: "$donorId",
            donorName: "$donorSnapshot.name",
            donorEmail: "$donorSnapshot.email",
            isAnonymous: "$isAnonymous"
          },
          totalAmount: { $sum: "$amount.minor" },
          donationCount: { $sum: 1 },
          lastDonation: { $max: "$createdAt" }
        }
      },
      {
        $project: {
          donorName: { $ifNull: ["$_id.donorName", "Anonymous Donor"] },
          donorEmail: "$_id.donorEmail",
          totalAmount: 1,
          donationCount: 1,
          lastDonation: 1,
          isAnonymous: "$_id.isAnonymous"
        }
      },
      { $sort: { totalAmount: -1 as -1 } },
      { $limit: limit }
    ];

    return this.model.aggregate(pipeline);
  }

  async getRevenueAnalytics(dateFrom?: Date, dateTo?: Date): Promise<{
    totalRevenue: number;
    campaignPayouts: number;
    totalFees: number;
    netRevenue: number;
    platformFees: number;
    paymentFees: number;
  }> {
    const matchStage: Record<string, unknown> = { status: "succeeded" };

    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) (matchStage.createdAt as Record<string, unknown>).$gte = dateFrom;
      if (dateTo) (matchStage.createdAt as Record<string, unknown>).$lte = dateTo;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          // Gross amount charged to donors (donation + fees when donor covers them).
          // Fall back to amount.minor for legacy donations missing totalChargedMinor.
          totalRevenue: { $sum: { $ifNull: ["$totalChargedMinor", "$amount.minor"] } },
          // What campaigns actually receive after fees.
          campaignPayouts: { $sum: { $ifNull: ["$campaignReceivesMinor", "$amount.minor"] } },
          // Payment processor (Monime) fee = base fee.
          paymentFees: { $sum: { $ifNull: ["$fees.baseFeeMinor", 0] } },
          // Platform (IB4ME) fee = processing fee.
          platformFees: { $sum: { $ifNull: ["$fees.processingFeeMinor", 0] } }
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    const data = result[0] || {
      totalRevenue: 0,
      campaignPayouts: 0,
      platformFees: 0,
      paymentFees: 0
    };

    return {
      ...data,
      totalFees: data.platformFees + data.paymentFees,
      // Net platform earnings = the platform's own fee (processor fee passes through to Monime).
      netRevenue: data.platformFees
    };
  }
}

export const donationRepository = new DonationRepository();
