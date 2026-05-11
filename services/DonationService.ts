import mongoose from "mongoose";
import {
  donationRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IDonation, IDonationTransfer } from "../models/Donation";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";
import type { DonationFilters, DonationListOptions } from "../repositories/DonationRepository";
import { auditLogService } from "./AuditLogService";
import type { AuditContext } from "../lib/admin-auth";
import type { ILedgerEntry } from "../models/LedgerEntry";

export interface DonationFeeInput {
  baseFeeMinor: number;
  processingFeeMinor: number;
  processingFeeBps: number;
  campaignType: "individual" | "organization";
  totalFeeMinor: number;
}

export interface CreateDonationInput {
  campaignId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId | null;
  donorSnapshot?: { name?: string; email?: string } | null;
  isAnonymous?: boolean;
  message?: string | null;
  amountMinor: number;              // Donation amount (what donor entered)
  totalChargedMinor?: number;       // Total charged to donor
  campaignReceivesMinor?: number;   // What campaign actually receives after fees
  donorCoversFee?: boolean;         // Whether donor chose to cover fees
  currency: string;
  provider: { name: string; paymentId?: string; checkoutSessionId?: string };
  fees?: DonationFeeInput;          // Fee breakdown
  idempotencyKey?: string | null;
}

export class DonationService {
  async createPending(input: CreateDonationInput): Promise<IDonation> {
    const existing = input.idempotencyKey
      ? await donationRepository.findByIdempotencyKey(input.idempotencyKey)
      : null;
    if (existing) return existing;

    // Build fee object if fees are provided
    const fees = input.fees ? {
      baseFeeMinor: input.fees.baseFeeMinor,
      processingFeeMinor: input.fees.processingFeeMinor,
      processingFeeBps: input.fees.processingFeeBps,
      campaignType: input.fees.campaignType,
      totalFeeMinor: input.fees.totalFeeMinor,
      // Legacy fields
      paymentFeeMinor: 0,
      platformFeeMinor: input.fees.totalFeeMinor, // For backward compat
    } : undefined;

    // Calculate campaign receives amount
    const donorCoversFee = input.donorCoversFee ?? true; // Default to donor covers fee for backward compat
    const campaignReceivesMinor = input.campaignReceivesMinor ?? input.amountMinor;

    return donationRepository.create({
      campaignId: input.campaignId,
      donorId: input.donorId ?? null,
      donorSnapshot: input.donorSnapshot ?? null,
      isAnonymous: Boolean(input.isAnonymous),
      message: input.message ?? null,
      amount: { currency: input.currency, minor: input.amountMinor },
      totalChargedMinor: input.totalChargedMinor ?? input.amountMinor,
      campaignReceivesMinor,
      donorCoversFee,
      fees,
      netAmountMinor: campaignReceivesMinor, // For backward compat, use what campaign receives
      provider: input.provider,
      status: "pending",
      idempotencyKey: input.idempotencyKey ?? null,
    } as unknown as Partial<IDonation>);
  }

  async markSucceeded(
    donationId: string,
    session?: ServiceSession
  ): Promise<IDonation> {
    return runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) throw new Error("Donation not found");
      if (donation.status === "succeeded") return donation;
      if (donation.status === "failed" || donation.status === "refunded") {
        throw new Error(
          "Cannot mark donation as succeeded from current status"
        );
      }

      const updated = await donationRepository.updateById(
        donation.id,
        { $set: { status: "succeeded" } } as never,
        txn
      );
      if (!updated) throw new Error("Failed to update donation status");

      // Ledger entry
      await ledgerEntryRepository.create(
        {
          campaignId: donation.campaignId,
          refType: "donation",
          refId: donation._id,
          direction: "in",
          amountMinor: donation.amount.minor,
          currency: donation.amount.currency,
        } as unknown as Partial<import("../models/LedgerEntry").ILedgerEntry>,
        txn
      );

      return updated;
    }, session);
  }

  async getById(donationId: string): Promise<IDonation | null> {
    return donationRepository.findById(donationId);
  }

  /**
   * Get donation with populated campaign and donor data
   * Used for admin views where full related data is needed
   */
  async getByIdWithRelations(donationId: string): Promise<IDonation | null> {
    return donationRepository.findByIdWithCampaign(donationId);
  }

  async updateCheckoutSession(
    donationId: string, 
    checkoutSessionId: string
  ): Promise<IDonation> {
    const updated = await donationRepository.updateById(
      donationId,
      { $set: { "provider.checkoutSessionId": checkoutSessionId } } as never
    );
    if (!updated) throw new Error("Failed to update donation with checkout session ID");
    return updated;
  }

  async markFailed(
    donationId: string,
    failureReason?: string
  ): Promise<IDonation> {
    const donation = await donationRepository.findById(donationId);
    if (!donation) throw new Error("Donation not found");

    if (donation.status === "succeeded") {
      throw new Error("Cannot mark succeeded donation as failed");
    }

    const updated = await donationRepository.updateById(
      donationId,
      {
        $set: {
          status: "failed",
          failureReason: failureReason || "Payment failed",
          updatedAt: new Date()
        }
      } as never
    );
    if (!updated) throw new Error("Failed to update donation status");
    return updated;
  }

  /**
   * Mark donation as payment_received (payment completed, transfer pending)
   * This is the intermediate status before the internal transfer to campaign
   */
  async markPaymentReceived(
    donationId: string,
    paymentDetails: {
      paymentId: string;
      paymentMethod: { type: string; provider?: string };
      fees?: { total: number; breakdown: Record<string, number> };
      completedAt?: string;
    },
    session?: ServiceSession
  ): Promise<IDonation> {
    return runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) throw new Error("Donation not found");

      if (donation.status !== "pending") {
        throw new Error(`Cannot mark donation as payment_received from status: ${donation.status}`);
      }

      // Preserve existing fee data and add payment processor fees
      const existingFees = donation.fees || {};
      const paymentProcessorFee = paymentDetails.fees ? Math.round(paymentDetails.fees.total) : 0;

      const fees = {
        baseFeeMinor: existingFees.baseFeeMinor || 0,
        processingFeeMinor: existingFees.processingFeeMinor || 0,
        processingFeeBps: existingFees.processingFeeBps,
        campaignType: existingFees.campaignType,
        totalFeeMinor: existingFees.totalFeeMinor || 0,
        paymentFeeMinor: paymentProcessorFee,
        platformFeeMinor: existingFees.platformFeeMinor || existingFees.totalFeeMinor || 0,
      };

      const updated = await donationRepository.updateById(
        donationId,
        {
          $set: {
            status: "payment_received",
            "provider.paymentId": paymentDetails.paymentId,
            fees,
            updatedAt: new Date()
          }
        } as never,
        txn
      );
      if (!updated) throw new Error("Failed to mark donation as payment_received");

      // Update campaign totals now that payment is confirmed
      const campaignReceivesAmount = donation.campaignReceivesMinor ?? donation.amount.minor;
      const incUpdate: Record<string, number> = {
        "totals.raisedMinor": campaignReceivesAmount,
        "totals.donationCount": 1,
      };
      const setUpdate: Record<string, unknown> = {
        "totals.lastDonationAt": new Date(),
      };

      await campaignRepository.updateById(
        donation.campaignId.toString(),
        { $inc: incUpdate as never, $set: setUpdate as never } as never,
        txn
      );

      return updated;
    }, session);
  }

  /**
   * Update transfer status on a donation
   */
  async updateTransferStatus(
    donationId: string,
    transfer: Partial<IDonationTransfer>
  ): Promise<IDonation> {
    const donation = await donationRepository.findById(donationId);
    if (!donation) throw new Error("Donation not found");

    const currentTransfer = donation.transfer || {};
    const updatedTransfer = {
      ...currentTransfer,
      ...transfer,
    };

    const updated = await donationRepository.updateById(
      donationId,
      {
        $set: {
          transfer: updatedTransfer,
          updatedAt: new Date()
        }
      } as never
    );
    if (!updated) throw new Error("Failed to update transfer status");
    return updated;
  }

  /**
   * Complete a donation after successful internal transfer
   * Creates ledger entries and updates campaign totals
   */
  async completeWithTransfer(
    donationId: string,
    transferId: string,
    session?: ServiceSession
  ): Promise<IDonation> {
    return runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) throw new Error("Donation not found");

      if (donation.status !== "payment_received" && donation.status !== "pending") {
        throw new Error(`Cannot complete donation from status: ${donation.status}`);
      }

      // Calculate what campaign actually receives
      // For backward compat with old donations, use donation.amount.minor if campaignReceivesMinor not set
      const campaignReceivesAmount = donation.campaignReceivesMinor ?? donation.amount.minor;

      // Update donation to succeeded
      const updated = await donationRepository.updateById(
        donationId,
        {
          $set: {
            status: "succeeded",
            transfer: {
              id: transferId,
              status: "completed" as const,
              initiatedAt: donation.transfer?.initiatedAt || new Date(),
              completedAt: new Date(),
              retryCount: donation.transfer?.retryCount || 0
            },
            completedAt: new Date(),
            updatedAt: new Date()
          }
        } as never,
        txn
      );
      if (!updated) throw new Error("Failed to complete donation");

      // Create platform receipt ledger entry
      await ledgerEntryRepository.create({
        accountType: "platform",
        refType: "platform_receipt",
        refId: donation._id,
        direction: "in",
        amountMinor: donation.totalChargedMinor || donation.amount.minor,
        currency: donation.amount.currency,
        description: `Payment received for donation ${donationId}`,
      } as unknown as Partial<ILedgerEntry>, txn);

      // Create platform fee ledger entry (if there are fees)
      const totalFees = donation.fees?.totalFeeMinor || 0;
      if (totalFees > 0) {
        await ledgerEntryRepository.create({
          accountType: "platform",
          campaignId: donation.campaignId,
          refType: "platform_fee",
          refId: donation._id,
          direction: "in",
          amountMinor: totalFees,
          currency: donation.amount.currency,
          description: `Platform fee for donation ${donationId}`,
        } as unknown as Partial<ILedgerEntry>, txn);
      }

      // Create platform transfer out ledger entry
      await ledgerEntryRepository.create({
        accountType: "platform",
        campaignId: donation.campaignId,
        refType: "platform_transfer_out",
        refId: donation._id,
        direction: "out",
        amountMinor: campaignReceivesAmount,
        currency: donation.amount.currency,
        transferId,
        description: `Transfer to campaign for donation ${donationId}`,
      } as unknown as Partial<ILedgerEntry>, txn);

      // Create campaign transfer in ledger entry
      await ledgerEntryRepository.create({
        accountType: "campaign",
        campaignId: donation.campaignId,
        refType: "campaign_transfer_in",
        refId: donation._id,
        direction: "in",
        amountMinor: campaignReceivesAmount,
        currency: donation.amount.currency,
        transferId,
        description: `Donation received from transfer ${transferId}`,
      } as unknown as Partial<ILedgerEntry>, txn);

      // Campaign totals already updated in markPaymentReceived()

      return updated;
    }, session);
  }

  /**
   * Get donations that need transfer retry
   */
  async getDonationsNeedingTransferRetry(maxRetries: number = 3): Promise<IDonation[]> {
    return donationRepository.findMany({
      status: "payment_received",
      $or: [
        { "transfer.status": "failed" },
        { "transfer.status": { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { "transfer.retryCount": { $lt: maxRetries } },
            { "transfer.retryCount": { $exists: false } }
          ]
        }
      ]
    } as never);
  }

  async markSucceededWithPaymentDetails(
    donationId: string,
    paymentDetails: {
      paymentId: string;
      paymentMethod: { type: string; provider?: string };
      fees?: { total: number; breakdown: Record<string, number> };
      completedAt?: string;
    },
    session?: ServiceSession
  ): Promise<IDonation> {
    return runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) throw new Error("Donation not found");
      if (donation.status === "succeeded") return donation;
      if (donation.status === "failed" || donation.status === "refunded") {
        throw new Error(
          "Cannot mark donation as succeeded from current status"
        );
      }

      // Preserve existing fee data (from donation creation) and add payment processor fees
      const existingFees = donation.fees || {};
      const paymentProcessorFee = paymentDetails.fees ? Math.round(paymentDetails.fees.total) : 0;

      const fees = {
        // Preserve platform fees from donation creation
        baseFeeMinor: existingFees.baseFeeMinor || 0,
        processingFeeMinor: existingFees.processingFeeMinor || 0,
        processingFeeBps: existingFees.processingFeeBps,
        campaignType: existingFees.campaignType,
        totalFeeMinor: existingFees.totalFeeMinor || 0,
        // Add payment processor fees from Monime
        paymentFeeMinor: paymentProcessorFee,
        platformFeeMinor: existingFees.platformFeeMinor || existingFees.totalFeeMinor || 0,
      };

      // Net amount = donation amount (campaign receives full amount since fees are added on top)
      const netAmountMinor = donation.amount.minor;

      const updated = await donationRepository.updateById(
        donation.id,
        {
          $set: {
            status: "succeeded",
            "provider.paymentId": paymentDetails.paymentId,
            fees,
            netAmountMinor,
            completedAt: paymentDetails.completedAt ? new Date(paymentDetails.completedAt) : new Date(),
            updatedAt: new Date()
          }
        } as never,
        txn
      );
      if (!updated) throw new Error("Failed to update donation status");

      // Update campaign totals
      const incUpdate: Record<string, number> = {
        "totals.raisedMinor": donation.amount.minor,
        "totals.donationCount": 1,
      };
      const setUpdate: Record<string, unknown> = {
        "totals.lastDonationAt": new Date(),
      };

      await campaignRepository.updateById(
        donation.campaignId.toString(),
        { $inc: incUpdate as never, $set: setUpdate as never } as never,
        txn
      );

      // Ledger entry
      await ledgerEntryRepository.create(
        {
          campaignId: donation.campaignId,
          refType: "donation",
          refId: donation._id,
          direction: "in",
          amountMinor: donation.amount.minor,
          currency: donation.amount.currency,
        } as unknown as Partial<import("../models/LedgerEntry").ILedgerEntry>,
        txn
      );

      return updated;
    }, session);
  }

  async listByCampaign(
    campaignId: mongoose.Types.ObjectId
  ): Promise<IDonation[]> {
    return donationRepository.listByCampaign(campaignId);
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
    return donationRepository.listForAdmin(filters, options);
  }

  async getAnalytics(dateFrom?: Date, dateTo?: Date): Promise<{
    totalDonations: number;
    totalAmount: number;
    successfulDonations: number;
    successfulAmount: number;
    pendingDonations: number;
    pendingAmount: number;
    failedDonations: number;
    averageDonation: number;
    successRate: number;
  }> {
    return donationRepository.getAnalyticsByDateRange(dateFrom, dateTo);
  }

  async getProviderBreakdown(dateFrom?: Date, dateTo?: Date): Promise<Array<{
    provider: string;
    count: number;
    amount: number;
    successRate: number;
  }>> {
    return donationRepository.getProviderBreakdown(dateFrom, dateTo);
  }

  async getTopDonors(limit: number = 10): Promise<Array<{
    donorName: string;
    donorEmail?: string;
    totalAmount: number;
    donationCount: number;
    lastDonation: Date;
    isAnonymous: boolean;
  }>> {
    return donationRepository.getTopDonors(limit);
  }

  async getRevenueReport(dateFrom?: Date, dateTo?: Date): Promise<{
    totalRevenue: number;
    totalFees: number;
    netRevenue: number;
    platformFees: number;
    paymentFees: number;
  }> {
    return donationRepository.getRevenueAnalytics(dateFrom, dateTo);
  }

  async resendReceipt(donationId: string): Promise<boolean> {
    const donation = await donationRepository.findById(donationId);
    if (!donation) {
      throw new Error("Donation not found");
    }

    if (donation.status !== "succeeded") {
      throw new Error("Cannot resend receipt for non-successful donation");
    }

    // TODO: Implement receipt resending logic
    // This would typically involve:
    // 1. Getting donation details
    // 2. Formatting receipt email/SMS
    // 3. Sending via notification service
    console.log(`Resending receipt for donation ${donationId}`);
    
    return true;
  }

  async flagForReview(
    donationId: string, 
    reason: string,
    flaggedBy: mongoose.Types.ObjectId,
    auditContext?: AuditContext
  ): Promise<IDonation> {
    const donation = await donationRepository.findById(donationId);
    if (!donation) {
      throw new Error("Donation not found");
    }

    const updated = await donationRepository.updateById(
      donationId,
      { 
        $set: { 
          isFlagged: true,
          flagReason: reason,
          flaggedBy,
          flaggedAt: new Date(),
          updatedAt: new Date()
        } 
      } as never
    );

    if (!updated) {
      throw new Error("Failed to flag donation for review");
    }

    // Log audit trail
    await auditLogService.record({
      actor: {
        userId: flaggedBy,
        role: "admin"
      },
      action: "donation.flagged_for_review",
      target: {
        type: "donation",
        id: new mongoose.Types.ObjectId(donationId)
      },
      diff: {
        previouslyFlagged: (donation as any).isFlagged || false,
        flagReason: reason,
        donationId,
        campaignId: donation.campaignId?.toString(),
        donorId: donation.donorId?.toString(),
        amount: donation.amount?.minor,
        currency: donation.amount?.currency
      },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent
    });

    return updated;
  }

  async unflagDonation(
    donationId: string,
    unflaggedBy: mongoose.Types.ObjectId,
    auditContext?: AuditContext
  ): Promise<IDonation> {
    const donation = await donationRepository.findById(donationId);
    if (!donation) {
      throw new Error("Donation not found");
    }

    const updated = await donationRepository.updateById(
      donationId,
      { 
        $unset: { 
          isFlagged: "",
          flagReason: "",
          flaggedBy: "",
          flaggedAt: ""
        },
        $set: {
          unflaggedBy,
          unflaggedAt: new Date(),
          updatedAt: new Date()
        }
      } as never
    );

    if (!updated) {
      throw new Error("Failed to unflag donation");
    }

    // Log audit trail
    await auditLogService.record({
      actor: {
        userId: unflaggedBy,
        role: "admin"
      },
      action: "donation.unflagged",
      target: {
        type: "donation",
        id: new mongoose.Types.ObjectId(donationId)
      },
      diff: {
        previouslyFlagged: (donation as any).isFlagged || false,
        previousFlagReason: (donation as any).flagReason,
        previousFlaggedBy: (donation as any).flaggedBy?.toString(),
        donationId,
        campaignId: donation.campaignId?.toString(),
        donorId: donation.donorId?.toString(),
        amount: donation.amount?.minor,
        currency: donation.amount?.currency
      },
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent
    });

    return updated;
  }

  async refundDonation(
    donationId: string,
    refundReason: string,
    refundedBy: mongoose.Types.ObjectId,
    auditContext?: AuditContext,
    session?: ServiceSession
  ): Promise<IDonation> {
    return runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) {
        throw new Error("Donation not found");
      }

      if (donation.status !== "succeeded") {
        throw new Error("Can only refund successful donations");
      }

      const previousStatus = donation.status;

      // TODO: Implement actual refund via payment provider
      // For now, just mark as refunded in database
      
      const updated = await donationRepository.updateById(
        donationId,
        { 
          $set: { 
            status: "refunded",
            refundReason,
            refundedBy,
            refundedAt: new Date(),
            updatedAt: new Date()
          } 
        } as never,
        txn
      );

      if (!updated) {
        throw new Error("Failed to mark donation as refunded");
      }

      // Reverse campaign totals
      const decUpdate: Record<string, number> = {
        "totals.raisedMinor": -donation.amount.minor,
        "totals.donationCount": -1,
      };

      await campaignRepository.updateById(
        donation.campaignId.toString(),
        { $inc: decUpdate as never } as never,
        txn
      );

      // Log audit trail
      await auditLogService.record({
        actor: {
          userId: refundedBy,
          role: "admin"
        },
        action: "donation.refunded",
        target: {
          type: "donation",
          id: new mongoose.Types.ObjectId(donationId)
        },
        diff: {
          previousStatus,
          newStatus: "refunded",
          refundReason,
          donationId,
          campaignId: donation.campaignId?.toString(),
          donorId: donation.donorId?.toString(),
          refundAmount: donation.amount?.minor,
          currency: donation.amount?.currency,
          originalDonationDate: donation.createdAt?.toISOString(),
          refundedAt: new Date().toISOString()
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      // Create reverse ledger entry
      await ledgerEntryRepository.create(
        {
          campaignId: donation.campaignId,
          refType: "donation_refund",
          refId: donation._id,
          direction: "out",
          amountMinor: donation.amount.minor,
          currency: donation.amount.currency,
          description: `Refund for donation ${donationId}: ${refundReason}`,
        } as unknown as Partial<import("../models/LedgerEntry").ILedgerEntry>,
        txn
      );

      return updated;
    }, session);
  }
}

export const donationService = new DonationService();
