import mongoose from "mongoose";
import { verificationRepository, userRepository } from "../repositories";
import { IVerification } from "../models/Verification";
import { IUser } from "../models/User";
import { auditLogService } from "./AuditLogService";
import type { AuditContext } from "../lib/admin-auth";

interface KycDocuments {
  idDocument?: string;
  addressProof?: string;
}

interface KybDocuments {
  registrationCertificate?: string;
  representativeId?: string;
  addressProof?: string;
  taxCertificate?: string;
}

interface VerificationFilters {
  status?: IVerification["status"] | "all";
  type?: "kyc" | "kyb" | "all";
  search?: string;
}

interface VerificationListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface PaginatedVerifications {
  verifications: IVerification[];
  total: number;
  page: number;
  totalPages: number;
}

interface VerificationStatusResponse {
  status: IVerification["status"];
  type: "kyc" | "kyb";
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  kycDocuments?: {
    idDocument?: string | null;
    addressProof?: string | null;
  };
  kybDocuments?: {
    registrationCertificate?: string | null;
    representativeId?: string | null;
    addressProof?: string | null;
    taxCertificate?: string | null;
  };
}

export class VerificationService {
  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<VerificationStatusResponse | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const verificationType = user.roles === "Organization" ? "kyb" : "kyc";
    const verification = await verificationRepository.getOrCreateForUser(userId, verificationType);

    return {
      status: verification.status,
      type: verification.type,
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      rejectionReason: verification.rejectionReason,
      kycDocuments: verification.type === "kyc" ? {
        idDocument: verification.kycDocuments?.idDocument?.toString() ?? null,
        addressProof: verification.kycDocuments?.addressProof?.toString() ?? null,
      } : undefined,
      kybDocuments: verification.type === "kyb" ? {
        registrationCertificate: verification.kybDocuments?.registrationCertificate?.toString() ?? null,
        representativeId: verification.kybDocuments?.representativeId?.toString() ?? null,
        addressProof: verification.kybDocuments?.addressProof?.toString() ?? null,
        taxCertificate: verification.kybDocuments?.taxCertificate?.toString() ?? null,
      } : undefined,
    };
  }

  /**
   * Upload a single KYC document
   */
  async uploadKycDocument(
    userId: string,
    documentType: keyof NonNullable<IVerification["kycDocuments"]>,
    assetId: string
  ): Promise<IVerification | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.roles === "Organization") {
      throw new Error("Organizations should use KYB verification");
    }

    const verification = await verificationRepository.getOrCreateForUser(userId, "kyc");

    if (verification.status === "approved") {
      throw new Error("Verification is already approved");
    }

    const verificationId = (verification._id as mongoose.Types.ObjectId).toString();
    return verificationRepository.updateKycDocuments(verificationId, {
      [documentType]: new mongoose.Types.ObjectId(assetId),
    });
  }

  /**
   * Upload a single KYB document
   */
  async uploadKybDocument(
    userId: string,
    documentType: keyof NonNullable<IVerification["kybDocuments"]>,
    assetId: string
  ): Promise<IVerification | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.roles !== "Organization") {
      throw new Error("Only organizations can use KYB verification");
    }

    const verification = await verificationRepository.getOrCreateForUser(userId, "kyb");

    if (verification.status === "approved") {
      throw new Error("Verification is already approved");
    }

    const verificationId = (verification._id as mongoose.Types.ObjectId).toString();
    return verificationRepository.updateKybDocuments(verificationId, {
      [documentType]: new mongoose.Types.ObjectId(assetId),
    });
  }

  /**
   * Submit KYC documents for verification
   */
  async submitKycDocuments(
    userId: string,
    documents: KycDocuments
  ): Promise<IVerification | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.roles === "Organization") {
      throw new Error("Organizations should use KYB verification");
    }

    const verification = await verificationRepository.getOrCreateForUser(userId, "kyc");
    const verificationId = (verification._id as mongoose.Types.ObjectId).toString();

    if (verification.status === "approved") {
      throw new Error("Verification is already approved");
    }

    if (verification.status === "under_review") {
      throw new Error("Verification is already under review");
    }

    // Update documents if provided
    if (documents.idDocument || documents.addressProof) {
      await verificationRepository.updateKycDocuments(verificationId, {
        idDocument: documents.idDocument
          ? new mongoose.Types.ObjectId(documents.idDocument)
          : verification.kycDocuments?.idDocument,
        addressProof: documents.addressProof
          ? new mongoose.Types.ObjectId(documents.addressProof)
          : verification.kycDocuments?.addressProof,
      });
    }

    // Re-fetch to check documents
    const updated = await verificationRepository.findById(verificationId);
    if (!updated?.kycDocuments?.idDocument || !updated?.kycDocuments?.addressProof) {
      throw new Error("Both ID document and address proof are required");
    }

    return verificationRepository.submitForVerification(verificationId);
  }

  /**
   * Submit KYB documents for verification
   */
  async submitKybDocuments(
    userId: string,
    documents: KybDocuments
  ): Promise<IVerification | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.roles !== "Organization") {
      throw new Error("Only organizations can use KYB verification");
    }

    const verification = await verificationRepository.getOrCreateForUser(userId, "kyb");
    const verificationId = (verification._id as mongoose.Types.ObjectId).toString();

    if (verification.status === "approved") {
      throw new Error("Verification is already approved");
    }

    if (verification.status === "under_review") {
      throw new Error("Verification is already under review");
    }

    // Update documents if provided
    const docUpdates: Partial<NonNullable<IVerification["kybDocuments"]>> = {};
    if (documents.registrationCertificate) {
      docUpdates.registrationCertificate = new mongoose.Types.ObjectId(documents.registrationCertificate);
    }
    if (documents.representativeId) {
      docUpdates.representativeId = new mongoose.Types.ObjectId(documents.representativeId);
    }
    if (documents.addressProof) {
      docUpdates.addressProof = new mongoose.Types.ObjectId(documents.addressProof);
    }
    if (documents.taxCertificate) {
      docUpdates.taxCertificate = new mongoose.Types.ObjectId(documents.taxCertificate);
    }

    if (Object.keys(docUpdates).length > 0) {
      await verificationRepository.updateKybDocuments(verificationId, docUpdates);
    }

    // Re-fetch to check documents
    const updated = await verificationRepository.findById(verificationId);
    if (
      !updated?.kybDocuments?.registrationCertificate ||
      !updated?.kybDocuments?.representativeId ||
      !updated?.kybDocuments?.addressProof ||
      !updated?.kybDocuments?.taxCertificate
    ) {
      throw new Error("All KYB documents are required: registration certificate, representative ID, address proof, and tax certificate");
    }

    return verificationRepository.submitForVerification(verificationId);
  }

  /**
   * Resubmit verification after rejection
   */
  async resubmitVerification(userId: string): Promise<IVerification | null> {
    const verification = await verificationRepository.findByUserId(userId);

    if (!verification) {
      throw new Error("Verification record not found");
    }

    if (verification.status !== "rejected") {
      throw new Error("Only rejected verifications can be resubmitted");
    }

    const verificationId = (verification._id as mongoose.Types.ObjectId).toString();

    // Check documents based on type
    if (verification.type === "kyc") {
      if (!verification.kycDocuments?.idDocument || !verification.kycDocuments?.addressProof) {
        throw new Error("Documents must be uploaded before resubmitting");
      }
    } else {
      if (
        !verification.kybDocuments?.registrationCertificate ||
        !verification.kybDocuments?.representativeId ||
        !verification.kybDocuments?.addressProof ||
        !verification.kybDocuments?.taxCertificate
      ) {
        throw new Error("All KYB documents must be uploaded before resubmitting");
      }
    }

    return verificationRepository.submitForVerification(verificationId);
  }

  // Admin methods

  /**
   * List verifications for admin (with pagination and filters)
   */
  async listForAdmin(
    filters: VerificationFilters = {},
    options: VerificationListOptions = {}
  ): Promise<PaginatedVerifications> {
    const {
      page = 1,
      limit = 20,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = options;

    const query: Record<string, unknown> = {};

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    } else {
      // Default to pending/under_review for admin view
      query.status = { $in: ["pending", "under_review"] };
    }

    if (filters.type && filters.type !== "all") {
      query.type = filters.type;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [verifications, total] = await Promise.all([
      verificationRepository.findMany(query as never, {
        query: { sort, skip, limit, populate: "userId" },
      } as never),
      verificationRepository.count(query as never),
    ]);

    // Filter by search if provided (search user name/email after population)
    let filteredVerifications = verifications;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredVerifications = verifications.filter((v) => {
        const user = v.userId as unknown as IUser | null;
        return (
          user?.name?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    return {
      verifications: filteredVerifications,
      total: filters.search ? filteredVerifications.length : total,
      page,
      totalPages: Math.ceil((filters.search ? filteredVerifications.length : total) / limit),
    };
  }

  /**
   * Get verification by ID
   */
  async getById(verificationId: string): Promise<IVerification | null> {
    return verificationRepository.findById(verificationId, {
      query: {
        populate: [
          { path: "userId" },
          { path: "kycDocuments.idDocument" },
          { path: "kycDocuments.addressProof" },
          { path: "kybDocuments.registrationCertificate" },
          { path: "kybDocuments.representativeId" },
          { path: "kybDocuments.addressProof" },
          { path: "kybDocuments.taxCertificate" },
        ]
      },
    } as never);
  }

  /**
   * Start review of a verification
   */
  async startReview(
    verificationId: string,
    adminId: string,
    auditContext?: AuditContext
  ): Promise<IVerification | null> {
    const verification = await verificationRepository.findById(verificationId);

    if (!verification) {
      throw new Error("Verification not found");
    }

    if (verification.status !== "pending") {
      throw new Error("Only pending verifications can be put under review");
    }

    const updated = await verificationRepository.updateStatus(
      verificationId,
      "under_review",
      adminId
    );

    if (updated && auditContext) {
      await auditLogService.record({
        actor: { userId: new mongoose.Types.ObjectId(adminId), role: "Admin" },
        action: "verification.start_review",
        target: { type: "Verification", id: new mongoose.Types.ObjectId(verificationId) },
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    return updated;
  }

  /**
   * Approve a verification
   */
  async approveVerification(
    verificationId: string,
    adminId: string,
    auditContext?: AuditContext
  ): Promise<IVerification | null> {
    const verification = await verificationRepository.findById(verificationId);

    if (!verification) {
      throw new Error("Verification not found");
    }

    if (verification.status === "approved") {
      throw new Error("Verification is already approved");
    }

    if (verification.status === "not_started") {
      throw new Error("Verification has not been submitted");
    }

    const updated = await verificationRepository.updateStatus(
      verificationId,
      "approved",
      adminId
    );

    if (updated) {
      // Update all campaigns owned by this user to reflect verified status
      // Late import to avoid circular dependency
      const { campaignService } = await import("./CampaignService");
      try {
        const updatedCount = await campaignService.updateCampaignsOwnerVerification(
          verification.userId,
          true,
          "approved"
        );
        console.log(`Updated ${updatedCount} campaigns for verified user ${verification.userId}`);
      } catch (error) {
        // Log but don't fail the approval if campaign update fails
        console.error(`Failed to update campaigns for user ${verification.userId}:`, error);
      }

      if (auditContext) {
        await auditLogService.record({
          actor: { userId: new mongoose.Types.ObjectId(adminId), role: "Admin" },
          action: "verification.approve",
          target: { type: "Verification", id: new mongoose.Types.ObjectId(verificationId) },
          ip: auditContext.ip,
          userAgent: auditContext.userAgent,
        });
      }
    }

    return updated;
  }

  /**
   * Reject a verification
   */
  async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string,
    auditContext?: AuditContext
  ): Promise<IVerification | null> {
    const verification = await verificationRepository.findById(verificationId);

    if (!verification) {
      throw new Error("Verification not found");
    }

    if (!reason) {
      throw new Error("Rejection reason is required");
    }

    if (verification.status === "not_started") {
      throw new Error("Verification has not been submitted");
    }

    const updated = await verificationRepository.updateStatus(
      verificationId,
      "rejected",
      adminId,
      reason
    );

    if (updated && auditContext) {
      await auditLogService.record({
        actor: { userId: new mongoose.Types.ObjectId(adminId), role: "Admin" },
        action: "verification.reject",
        target: { type: "Verification", id: new mongoose.Types.ObjectId(verificationId) },
        diff: { reason },
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
      });
    }

    return updated;
  }

  /**
   * Check if a user is verified to create campaigns
   */
  async isUserVerifiedForCampaigns(userId: string): Promise<{
    verified: boolean;
    reason?: string;
    role: string;
    status?: string;
  }> {
    const user = await userRepository.findById(userId);

    if (!user) {
      return { verified: false, reason: "User not found", role: "unknown" };
    }

    const role = user.roles ?? "User";

    // Admins don't need verification
    if (role === "Admin" || role === "SuperAdmin") {
      return { verified: true, role };
    }

    const verificationType = role === "Organization" ? "kyb" : "kyc";
    const verification = await verificationRepository.findByUserId(userId);

    if (!verification) {
      return {
        verified: false,
        reason: `${verificationType.toUpperCase()} verification required`,
        role,
        status: "not_started",
      };
    }

    if (verification.status === "approved") {
      return { verified: true, role, status: "approved" };
    }

    let reason = `${verificationType.toUpperCase()} verification required`;
    if (verification.status === "pending") {
      reason = `${verificationType.toUpperCase()} verification is pending`;
    } else if (verification.status === "under_review") {
      reason = `${verificationType.toUpperCase()} is under review`;
    } else if (verification.status === "rejected") {
      reason = `${verificationType.toUpperCase()} was rejected: ${verification.rejectionReason || "Please resubmit"}`;
    }

    return { verified: false, reason, role, status: verification.status };
  }
}

export const verificationService = new VerificationService();
