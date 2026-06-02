import { campaignRepository, donationRepository, userRepository, payoutRepository } from "../repositories";

export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalDonations: number;
  totalRevenue: number;
  campaignBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  donationBreakdown: {
    completed: number;
    failed: number;
    pending: number;
    refunded: number;
    successRate: number;
  };
  monthlyRevenue: Array<{month: string; revenue: number}>;
  averageDonationAmount: number;
  totalUsers: number;
  finance: {
    grossDonations: number;       // gross succeeded donation volume (sum amount.minor)
    platformRevenue: number;      // IB4ME net earnings (processing fee only)
    processorFees: number;        // Monime processor fees (pass-through)
    totalFees: number;            // platform + processor fees
    netToCampaigns: number;       // what campaigns receive after fees
    effectiveTakeRateBps: number; // platformRevenue / grossDonations, in basis points
    paidOutToCampaigns: number;   // completed payout amount disbursed
    pendingPayouts: number;       // count of payouts awaiting completion
    pendingPayoutAmount: number;  // amount awaiting payout
  };
  platformHealth: {
    campaignHealth: string;
    paymentHealth: string;
    systemHealth: string;
  };
}

export class DashboardService {
  private cache: Map<string, {data: any; timestamp: number}> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = "dashboard-stats";
    const cachedStats = this.getCachedData(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }

    try {
      // Get basic counts in parallel
      const [
        totalCampaigns,
        totalDonations,
        totalUsers,
        activeCampaigns,
        pendingCampaigns,
        approvedCampaigns,
        rejectedCampaigns,
        completedCampaigns
      ] = await Promise.all([
        campaignRepository.count({}),
        donationRepository.count({}),
        userRepository.count({ role: { $ne: "admin" } }), // Exclude admin users
        campaignRepository.count({ status: "active" }),
        campaignRepository.count({ "verification.status": "pending" }),
        campaignRepository.count({ "verification.status": "approved" }),
        campaignRepository.count({ "verification.status": "rejected" }),
        campaignRepository.count({ status: "completed" })
      ]);

      // Get donation statistics with aggregation
      const donationStats = await this.getDonationStatistics();
      const monthlyRevenue = await this.getMonthlyRevenue();
      const platformHealth = await this.getPlatformHealth();

      // Real money flow: platform revenue (our fee), fees, campaign payouts, and disbursements.
      const [revenue, payouts] = await Promise.all([
        donationRepository.getRevenueAnalytics(),
        payoutRepository.getAnalyticsByDateRange()
      ]);

      // Gross donation volume (sum of succeeded amount.minor) — the basis for our take rate.
      const grossDonations = donationStats.totalRevenue;
      const effectiveTakeRateBps = grossDonations > 0
        ? Math.round((revenue.netRevenue / grossDonations) * 10000)
        : 0;

      const stats: DashboardStats = {
        totalCampaigns,
        activeCampaigns,
        totalDonations,
        totalRevenue: donationStats.totalRevenue,
        campaignBreakdown: {
          pending: pendingCampaigns,
          approved: approvedCampaigns,
          rejected: rejectedCampaigns,
          completed: completedCampaigns
        },
        donationBreakdown: donationStats.breakdown,
        monthlyRevenue,
        averageDonationAmount: donationStats.averageAmount,
        totalUsers,
        finance: {
          grossDonations,
          platformRevenue: revenue.netRevenue,
          processorFees: revenue.paymentFees,
          totalFees: revenue.totalFees,
          netToCampaigns: revenue.campaignPayouts,
          effectiveTakeRateBps,
          // Money that has left toward campaigns (incl. in-transit), matching the
          // platform-wide "withdrawn" definition — payouts rarely reach "completed".
          paidOutToCampaigns: payouts.disbursedAmount,
          pendingPayouts: payouts.awaitingPayouts,
          pendingPayoutAmount: payouts.awaitingAmount
        },
        platformHealth
      };

      this.setCachedData(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  private async getDonationStatistics() {
    // Delegate to the repository aggregation, which correctly keys success off the
    // real donation status "succeeded" (the schema has no "completed" status).
    const analytics = await donationRepository.getAnalyticsByDateRange();

    // The UI's "Completed" bucket represents succeeded donations.
    const breakdown = {
      completed: analytics.successfulDonations,
      failed: analytics.failedDonations,
      pending: analytics.pendingDonations,
      refunded: analytics.refundedDonations,
      successRate: Math.round(analytics.successRate)
    };

    // Gross revenue = sum of amount.minor across succeeded donations.
    const totalRevenue = analytics.successfulAmount;

    // Average over succeeded donations only.
    const averageAmount = analytics.successfulDonations > 0
      ? Math.round(analytics.successfulAmount / analytics.successfulDonations)
      : 0;

    return {
      totalRevenue,
      breakdown,
      averageAmount
    };
  }

  private async getMonthlyRevenue(): Promise<Array<{month: string; revenue: number}>> {
    const thirteenMonthsAgo = new Date();
    thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 12);

    const monthlyAggregation = await donationRepository.mongoModel.aggregate([
      {
        $match: {
          status: "succeeded",
          createdAt: { $gte: thirteenMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$amount.minor" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Generate last 12 months
    const months: Array<{month: string; revenue: number}> = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      
      // Find revenue for this month
      const monthData = monthlyAggregation.find(item => 
        item._id.year === year && item._id.month === month
      );
      
      months.push({
        month: monthName,
        revenue: monthData ? monthData.revenue : 0
      });
    }

    return months;
  }

  private async getPlatformHealth(): Promise<{campaignHealth: string; paymentHealth: string; systemHealth: string}> {
    try {
      // Campaign health: based on approval rate and active campaigns
      const [totalCampaigns, approvedCampaigns, activeCampaigns] = await Promise.all([
        campaignRepository.count({}),
        campaignRepository.count({ "verification.status": "approved" }),
        campaignRepository.count({ status: "active" })
      ]);

      let campaignHealth = "healthy";
      if (totalCampaigns > 0) {
        const approvalRate = (approvedCampaigns / totalCampaigns) * 100;
        const activityRate = (activeCampaigns / totalCampaigns) * 100;
        
        if (approvalRate < 60 || activityRate < 30) {
          campaignHealth = "warning";
        }
      }

      // Payment health: based on success rate
      const donationStats = await this.getCachedData("donation-stats") || await this.getDonationStatistics();
      let paymentHealth = "healthy";
      
      if (donationStats.breakdown.successRate < 80) {
        paymentHealth = "warning";
      }

      // System health: basic check (could be enhanced with more metrics)
      const systemHealth = "healthy"; // Could check database performance, API response times, etc.

      return {
        campaignHealth,
        paymentHealth,
        systemHealth
      };
    } catch (error) {
      console.error("Error calculating platform health:", error);
      return {
        campaignHealth: "warning",
        paymentHealth: "warning",
        systemHealth: "warning"
      };
    }
  }

  async getRecentActivity(limit: number = 10) {
    try {
      // Get recent donations and campaigns
      const [recentDonations, recentCampaigns] = await Promise.all([
        donationRepository.findMany({}, {
          query: { sort: { createdAt: -1 }, limit: limit / 2, populate: 'campaignId donorId' }
        }),
        campaignRepository.findMany({}, {
          query: { sort: { createdAt: -1 }, limit: limit / 2, populate: 'ownerId' }
        })
      ]);

      // Combine and sort by date
      const activities = [
        ...recentDonations.map(donation => ({
          type: 'donation' as const,
          data: donation,
          timestamp: donation.createdAt
        })),
        ...recentCampaigns.map(campaign => ({
          type: 'campaign' as const,
          data: campaign,
          timestamp: campaign.createdAt
        }))
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);

      return activities;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();
