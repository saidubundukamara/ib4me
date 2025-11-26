import mongoose from "mongoose";
import { campaignRepository, userRepository } from "../repositories";
import { ICampaign } from "../models/Campaign";
import { monimeService, MonimeFinancialAccountRequest, MonimeApiError } from "../lib/monime";
import { runInTransaction } from "./ServiceTransaction";
import { auditLogService } from "./AuditLogService";
import { verificationService } from "./VerificationService";
import { settingService } from "./SettingService";
import type { AuditContext } from "../lib/admin-auth";

interface CampaignFilters {
  status?: ICampaign["status"] | "all";
  verificationStatus?: string;
  urgency?: ICampaign["urgency"];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface CampaignListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface PaginatedCampaigns {
  campaigns: ICampaign[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CampaignLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  userType: "individual" | "organization";
  reason?: string;
}

export class CampaignService {
  async getBySlug(slug: string): Promise<ICampaign | null> {
    return campaignRepository.findBySlug(slug);
  }

  async getById(id: string): Promise<ICampaign | null> {
    return campaignRepository.findById(id);
  }

  async listByOwner(ownerId: mongoose.Types.ObjectId): Promise<ICampaign[]> {
    return campaignRepository.listByOwner(ownerId);
  }

  async listActive(): Promise<ICampaign[]> {
    return campaignRepository.listByStatus("active");
  }

  // Admin methods
  async listForAdmin(
    filters: CampaignFilters = {},
    options: CampaignListOptions = {}
  ): Promise<PaginatedCampaigns> {
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
    
    if (filters.verificationStatus) {
      query["verification.status"] = filters.verificationStatus;
    }
    
    if (filters.urgency) {
      query.urgency = filters.urgency;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }
    
    if (filters.search) {
      query.$or = [
        { "patient.name": { $regex: filters.search, $options: "i" } },
        { diagnosis: { $regex: filters.search, $options: "i" } },
        { slug: { $regex: filters.search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      campaignRepository.findMany(query as never, {
        query: { sort, skip, limit }
      } as any),
      campaignRepository.count(query as never)
    ]);

    return {
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateCampaignStatus(
    campaignId: string, 
    status: ICampaign["status"],
    adminId: mongoose.Types.ObjectId,
    reason?: string,
    auditContext?: AuditContext
  ): Promise<ICampaign | null> {
    return runInTransaction(async (session) => {
      // Get original campaign for audit diff
      const originalCampaign = await campaignRepository.findById(campaignId);
      if (!originalCampaign) {
        throw new Error("Campaign not found");
      }

      const previousStatus = originalCampaign.status;
      
      const updatedCampaign = await campaignRepository.updateById(
        campaignId,
        { $set: { status, updatedAt: new Date() } } as never,
        session
      );

      if (!updatedCampaign) {
        throw new Error("Failed to update campaign status");
      }

      // Log audit trail
      await auditLogService.record({
        actor: {
          userId: adminId,
          role: "admin"
        },
        action: "campaign.status_updated",
        target: {
          type: "campaign",
          id: new mongoose.Types.ObjectId(campaignId)
        },
        diff: {
          previousStatus,
          newStatus: status,
          reason,
          campaignId,
          campaignSlug: originalCampaign.slug
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      return updatedCampaign;
    });
  }

  async updateVerificationStatus(
    campaignId: string,
    verificationStatus: string,
    adminId: mongoose.Types.ObjectId,
    reason?: string,
    auditContext?: AuditContext
  ): Promise<ICampaign | null> {
    return runInTransaction(async (session) => {
      // Get original campaign for audit diff
      const originalCampaign = await campaignRepository.findById(campaignId);
      if (!originalCampaign) {
        throw new Error("Campaign not found");
      }

      const previousVerificationStatus = originalCampaign.verification?.status;

      const updateData: Record<string, unknown> = {
        "verification.status": verificationStatus,
        "verification.verifiedAt": new Date(),
        "verification.verifiedBy": adminId,
        updatedAt: new Date()
      };

      const updatedCampaign = await campaignRepository.updateById(
        campaignId,
        { $set: updateData } as never,
        session
      );

      if (!updatedCampaign) {
        throw new Error("Failed to update campaign verification status");
      }

      // Log audit trail
      await auditLogService.record({
        actor: {
          userId: adminId,
          role: "admin"
        },
        action: "campaign.verification_updated",
        target: {
          type: "campaign",
          id: new mongoose.Types.ObjectId(campaignId)
        },
        diff: {
          previousVerificationStatus,
          newVerificationStatus: verificationStatus,
          reason,
          campaignId,
          campaignSlug: originalCampaign.slug,
          verifiedBy: adminId.toString(),
          verifiedAt: new Date().toISOString()
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      return updatedCampaign;
    });
  }

  async getCampaignAnalytics(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    pendingApprovals: number;
    totalRaised: number;
    verificationBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
  }> {
    const [
      totalCampaigns,
      activeCampaigns, 
      pendingApprovals,
      allCampaigns
    ] = await Promise.all([
      campaignRepository.count({} as never),
      campaignRepository.count({ status: "active" } as never),
      campaignRepository.count({ "verification.status": "pending" } as never),
      campaignRepository.findMany({} as never, { 
        query: { 
          select: "status verification.status totals.raisedMinor" 
        }
      })
    ]);

    const totalRaised = allCampaigns.reduce((sum, campaign) => 
      sum + (campaign.totals?.raisedMinor || 0), 0
    );

    const verificationBreakdown = allCampaigns.reduce((acc, campaign) => {
      const status = campaign.verification?.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = allCampaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCampaigns,
      activeCampaigns,
      pendingApprovals,
      totalRaised,
      verificationBreakdown,
      statusBreakdown
    };
  }

  async checkCampaignLimitForUser(userId: string): Promise<CampaignLimitCheckResult> {
    // Fetch user to determine role
    const user = await userRepository.findById(userId);
    if (!user) {
      return {
        allowed: false,
        currentCount: 0,
        maxAllowed: 0,
        userType: "individual",
        reason: "User not found"
      };
    }

    const role = user.roles ?? "User";

    // Admins and SuperAdmins have no limit
    if (role === "Admin" || role === "SuperAdmin") {
      return {
        allowed: true,
        currentCount: 0,
        maxAllowed: Infinity,
        userType: "individual"
      };
    }

    // Get configurable limits from settings
    const limits = await settingService.getCampaignLimitsSettings();
    const isOrganization = role === "Organization";
    const maxAllowed = isOrganization
      ? limits.maxActiveCampaignsOrganization
      : limits.maxActiveCampaignsIndividual;

    // Count current active campaigns
    const currentCount = await campaignRepository.countActiveApprovedByOwner(
      new mongoose.Types.ObjectId(userId)
    );

    if (currentCount >= maxAllowed) {
      const userLabel = isOrganization ? "Organizations" : "Individual users";
      return {
        allowed: false,
        currentCount,
        maxAllowed,
        userType: isOrganization ? "organization" : "individual",
        reason: `${userLabel} can have a maximum of ${maxAllowed} active campaigns. You currently have ${currentCount}.`
      };
    }

    return {
      allowed: true,
      currentCount,
      maxAllowed,
      userType: isOrganization ? "organization" : "individual"
    };
  }

  async createCampaign(campaignData: Partial<ICampaign>): Promise<ICampaign> {
    // Check if user is verified before creating campaign
    if (campaignData.ownerId) {
      const verificationStatus = await verificationService.isUserVerifiedForCampaigns(
        campaignData.ownerId.toString()
      );

      if (!verificationStatus.verified) {
        throw new Error(verificationStatus.reason || "User verification required to create campaigns");
      }

      // Check campaign limit
      const limitCheck = await this.checkCampaignLimitForUser(campaignData.ownerId.toString());
      if (!limitCheck.allowed) {
        throw new Error(limitCheck.reason || "Campaign limit reached");
      }
    }

    return runInTransaction(async (session) => {
      // Create the campaign first
      const campaign = await campaignRepository.create(campaignData, session);
      
      // Create financial account with Monime
      const financialAccountRequest: MonimeFinancialAccountRequest = {
        name: `Campaign: ${campaign.slug}`,
        currency: campaign.goal?.currency || "SLE",
        reference: campaign.slug,
        description: `Financial account for campaign: ${campaign.patient?.name || campaign.diagnosis || campaign.slug}`,
      };
      
      try {
        const financialAccount = await monimeService.createFinancialAccount(
          financialAccountRequest,
          `campaign-${campaign._id}-${Date.now()}`
        );
        
        // Update campaign with financial account details
        const updatedCampaign = await campaignRepository.updateById(
          String(campaign._id),
          {
            $set: {
              financial_account: {
                id: financialAccount.id,
                uvan: financialAccount.uvan,
              },
            },
          },
          session
        );

        if (!updatedCampaign) {
          throw new Error("Failed to update campaign with financial account");
        }

        return updatedCampaign;
      } catch (error) {
        // Financial account creation failed - transaction will be rolled back
        console.error('Financial account creation error:', error);

        if (error instanceof MonimeApiError) {
          throw new Error(`Failed to create financial account: ${error.message} (Status: ${error.statusCode}, Code: ${error.code})`);
        }
        throw new Error(`Failed to create financial account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
}

export const campaignService = new CampaignService();
