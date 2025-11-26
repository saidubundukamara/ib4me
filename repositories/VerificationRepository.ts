import mongoose from "mongoose";
import { BaseRepository, RepositorySession } from "./BaseRepository";
import Verification, { IVerification } from "../models/Verification";

export class VerificationRepository extends BaseRepository<IVerification> {
  constructor() {
    super(Verification);
  }

  async findByUserId(userId: string): Promise<IVerification | null> {
    return this.findOne({ userId: new mongoose.Types.ObjectId(userId) } as never);
  }

  async findPendingVerifications(
    type?: "kyc" | "kyb"
  ): Promise<IVerification[]> {
    const query: Record<string, unknown> = {
      status: { $in: ["pending", "under_review"] },
    };

    if (type) {
      query.type = type;
    }

    return this.findMany(query as never, {
      query: { sort: { submittedAt: -1 }, populate: "userId" },
    } as never);
  }

  async findByStatus(
    status: IVerification["status"],
    type?: "kyc" | "kyb"
  ): Promise<IVerification[]> {
    const query: Record<string, unknown> = { status };

    if (type) {
      query.type = type;
    }

    return this.findMany(query as never, {
      query: { sort: { createdAt: -1 }, populate: "userId" },
    } as never);
  }

  async updateStatus(
    verificationId: string,
    status: IVerification["status"],
    reviewedBy?: string,
    rejectionReason?: string,
    session?: RepositorySession
  ): Promise<IVerification | null> {
    const update: Record<string, unknown> = {
      status,
    };

    if (reviewedBy) {
      update.reviewedBy = new mongoose.Types.ObjectId(reviewedBy);
      update.reviewedAt = new Date();
    }

    if (rejectionReason) {
      update.rejectionReason = rejectionReason;
    }

    return this.updateById(verificationId, { $set: update } as never, session);
  }

  async submitForVerification(
    verificationId: string,
    session?: RepositorySession
  ): Promise<IVerification | null> {
    return this.updateById(
      verificationId,
      {
        $set: {
          status: "pending",
          submittedAt: new Date(),
          rejectionReason: null,
        },
      } as never,
      session
    );
  }

  async updateKycDocuments(
    verificationId: string,
    documents: Partial<NonNullable<IVerification["kycDocuments"]>>,
    session?: RepositorySession
  ): Promise<IVerification | null> {
    const update: Record<string, unknown> = {};

    if (documents.idDocument !== undefined) {
      update["kycDocuments.idDocument"] = documents.idDocument
        ? new mongoose.Types.ObjectId(documents.idDocument.toString())
        : null;
    }

    if (documents.addressProof !== undefined) {
      update["kycDocuments.addressProof"] = documents.addressProof
        ? new mongoose.Types.ObjectId(documents.addressProof.toString())
        : null;
    }

    return this.updateById(verificationId, { $set: update } as never, session);
  }

  async updateKybDocuments(
    verificationId: string,
    documents: Partial<NonNullable<IVerification["kybDocuments"]>>,
    session?: RepositorySession
  ): Promise<IVerification | null> {
    const update: Record<string, unknown> = {};

    if (documents.registrationCertificate !== undefined) {
      update["kybDocuments.registrationCertificate"] = documents.registrationCertificate
        ? new mongoose.Types.ObjectId(documents.registrationCertificate.toString())
        : null;
    }

    if (documents.representativeId !== undefined) {
      update["kybDocuments.representativeId"] = documents.representativeId
        ? new mongoose.Types.ObjectId(documents.representativeId.toString())
        : null;
    }

    if (documents.addressProof !== undefined) {
      update["kybDocuments.addressProof"] = documents.addressProof
        ? new mongoose.Types.ObjectId(documents.addressProof.toString())
        : null;
    }

    if (documents.taxCertificate !== undefined) {
      update["kybDocuments.taxCertificate"] = documents.taxCertificate
        ? new mongoose.Types.ObjectId(documents.taxCertificate.toString())
        : null;
    }

    return this.updateById(verificationId, { $set: update } as never, session);
  }

  async getOrCreateForUser(
    userId: string,
    type: "kyc" | "kyb",
    session?: RepositorySession
  ): Promise<IVerification> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      // If type doesn't match, update it
      if (existing.type !== type) {
        const existingId = (existing._id as mongoose.Types.ObjectId).toString();
        const updated = await this.updateById(
          existingId,
          { $set: { type } } as never,
          session
        );
        return updated || existing;
      }
      return existing;
    }

    return this.create(
      {
        userId: new mongoose.Types.ObjectId(userId),
        type,
        status: "not_started",
      } as Partial<IVerification>,
      session
    );
  }
}

export const verificationRepository = new VerificationRepository();
