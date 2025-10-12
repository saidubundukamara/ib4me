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
    // Aggregate donation statistics
    const donationAggregation = await donationRepository.mongoModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { 
            $sum: { 
              $cond: [
                { $eq: ["$status", "completed"] },
                "$amount.minor",
                0
              ]
            }
          }
        }
      }
    ]);

    // Initialize breakdown with zeros
    const breakdown = {
      completed: 0,
      failed: 0,
      pending: 0,
      refunded: 0,
      successRate: 0
    };

    let totalRevenue = 0;
    let totalDonations = 0;
    let completedDonations = 0;

    // Process aggregation results
    donationAggregation.forEach((item) => {
      const status = item._id as keyof typeof breakdown;
      if (status in breakdown) {
        breakdown[status] = item.count;
      }
      totalDonations += item.count;
      
      if (status === "completed") {
        totalRevenue = item.totalAmount;
        completedDonations = item.count;
      }
    });

    // Calculate success rate
    if (totalDonations > 0) {
      breakdown.successRate = Math.round((completedDonations / totalDonations) * 100);
    }

    // Calculate average donation amount
    const averageAmount = completedDonations > 0 ? Math.round(totalRevenue / completedDonations) : 0;

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
          status: "completed",
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
