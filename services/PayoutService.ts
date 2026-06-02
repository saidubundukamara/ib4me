import mongoose from "mongoose";
import {
  payoutRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IPayout, IPayoutApproval, IPayoutPolicyCheck } from "../models/Payout";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";
import { monimeService, MonimePayoutRequest } from "../lib/monime";
import { resolveMobileOperator } from "../lib/mobileMoney";
import { randomUUID } from "crypto";
import type { PayoutFilters, PayoutListOptions } from "../repositories/PayoutRepository";
import { auditLogService } from "./AuditLogService";
import { settingService } from "./SettingService";

export interface RequestPayoutInput {
  campaignId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  amountMinor: number;
  method: IPayout["method"];
}

export class PayoutService {
  /**
   * Check if withdrawals are globally blocked
   */
  async isWithdrawalsBlocked(): Promise<{ blocked: boolean; reason?: string }> {
    const withdrawalSettings = await settingService.getWithdrawalSettings();
    return {
      blocked: withdrawalSettings.withdrawalsBlocked,
      reason: withdrawalSettings.blockedReason
    };
  }

  /**
   * Check if payout amount meets minimum withdrawal threshold
   * Threshold is based on:
   * 1. Fixed minimum amount (e.g., 50,000 SLE)
   * 2. Percentage of AMOUNT RAISED (not goal)
   *
   * If thresholdEnabled is false, all withdrawals are allowed.
   */
  private async checkMinimumThreshold(
    amountMinor: number,
    campaignId: mongoose.Types.ObjectId,
    settings?: { minimumWithdrawalAmount?: number; minimumWithdrawalPercent?: number }
  ): Promise<IPayoutPolicyCheck> {
    // Get withdrawal settings from platform settings
    const withdrawalSettings = await settingService.getWithdrawalSettings();

    // If threshold is disabled, always allow withdrawals
    if (!withdrawalSettings.thresholdEnabled) {
      return { minThresholdMet: true, overrideBy: null };
    }

    // Use provided settings or fall back to platform settings
    const minThreshold = settings?.minimumWithdrawalAmount ?? withdrawalSettings.minAmountMinor;
    const minPercent = settings?.minimumWithdrawalPercent ?? withdrawalSettings.minPercent;

    // Check fixed amount threshold
    const fixedThresholdMet = amountMinor >= minThreshold;

    // Check percentage-based threshold (percentage of AMOUNT RAISED)
    const campaign = await campaignRepository.findById(campaignId.toString());
    let percentageThresholdMet = true; // Default to true if no raised amount

    const raisedMinor = campaign?.totals?.raisedMinor ?? 0;
    if (raisedMinor > 0 && minPercent > 0) {
      const percentageThreshold = raisedMinor * (minPercent / 100);
      percentageThresholdMet = amountMinor >= percentageThreshold;
    }

    const minThresholdMet = fixedThresholdMet && percentageThresholdMet;

    return {
      minThresholdMet,
      overrideBy: null
    };
  }

  async requestPayout(
    input: RequestPayoutInput,
    settings?: { minimumWithdrawalAmount?: number; minimumWithdrawalPercent?: number },
    auditContext?: { ip?: string; userAgent?: string }
  ): Promise<IPayout> {
    if (input.amountMinor <= 0)
      throw new Error("Payout amount must be positive");

    // Check if withdrawals are globally blocked
    const blockStatus = await this.isWithdrawalsBlocked();
    if (blockStatus.blocked) {
      const message = blockStatus.reason
        ? `Withdrawals are temporarily disabled: ${blockStatus.reason}`
        : "Withdrawals are temporarily disabled. Please try again later.";
      throw new Error(message);
    }

    return runInTransaction<IPayout>(async (txn) => {
      // Get campaign and verify financial account exists
      const campaign = await campaignRepository.findById(
        input.campaignId.toString()
      );
      if (!campaign) throw new Error("Campaign not found");
      if (!campaign.financial_account?.id) {
        throw new Error("Campaign does not have a financial account");
      }

      // Verify campaign ownership
      if (campaign.ownerId.toString() !== input.requestedBy.toString()) {
        throw new Error("Not authorized to withdraw from this campaign");
      }

      // Verify sufficient funds
      const raised = campaign.totals?.raisedMinor ?? 0;
      const paid = campaign.withdrawals?.totalPaidMinor ?? 0;
      const availableMinor = Math.max(0, raised - paid);
      if (input.amountMinor > availableMinor) {
        throw new Error("Insufficient funds available for withdrawal");
      }

      // Check minimum withdrawal threshold
      const policyCheck = await this.checkMinimumThreshold(
        input.amountMinor,
        input.campaignId,
        settings
      );

      // Determine initial status based on threshold check
      const initialStatus = policyCheck.minThresholdMet ? "processing" : "threshold_review";

      // Create payout record first
      const payout = await payoutRepository.create(
        {
          campaignId: input.campaignId,
          requestedBy: input.requestedBy,
          amountMinor: input.amountMinor,
          method: input.method,
          status: initialStatus,
          policyCheck,
        } as unknown as Partial<IPayout>,
        txn
      );

      // Create audit log for payout request
      await auditLogService.record({
        actor: {
          userId: input.requestedBy,
          role: "user"
        },
        action: "payout.requested",
        target: {
          type: "payout",
          id: new mongoose.Types.ObjectId(payout.id)
        },
        diff: {
          amountMinor: input.amountMinor,
          method: input.method,
          campaignId: input.campaignId.toString(),
          thresholdMet: policyCheck.minThresholdMet,
          status: initialStatus
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      // If below threshold, skip Monime processing and return for admin review
      if (!policyCheck.minThresholdMet) {
        await auditLogService.record({
          actor: {
            userId: input.requestedBy,
            role: "user"
          },
          action: "payout.threshold_review_required",
          target: {
            type: "payout",
            id: new mongoose.Types.ObjectId(payout.id)
          },
          diff: {
            amountMinor: input.amountMinor,
            minThreshold: settings?.minimumWithdrawalAmount ?? 50000,
            reason: "Amount below minimum withdrawal threshold"
          },
          ip: auditContext?.ip,
          userAgent: auditContext?.userAgent
        });

        return payout;
      }

      // Continue with existing Monime processing for threshold-compliant payouts
      try {
        // Prepare Monime payout request
        let destination: MonimePayoutRequest["destination"];

        if (input.method.type === "mobile_money") {
          const phoneNumber =
            (input.method as { type: "mobile_money"; msisdn?: string })
              .msisdn || "";
          // Operator resolved at request time (KYC step) is stored on method.provider;
          // fall back to a live lookup so the correct provider (Orange/Africell) is used.
          const providerId =
            (input.method as { type: "mobile_money"; provider?: string })
              .provider || resolveMobileOperator(phoneNumber).providerId;
          destination = {
            type: "momo",
            providerId,
            phoneNumber,
          };
        } else {
          destination = {
            type: "bank",
            providerId: (input.method as { type: "bank"; providerId?: string })
              .providerId,
            accountNumber:
              (input.method as { type: "bank"; accountNumber?: string })
                .accountNumber || "",
            accountName: input.method.accountName,
          };
        }

        const monimeRequest: MonimePayoutRequest = {
          destination,
          amount: {
            value: input.amountMinor,
            currency: campaign.goal?.currency ?? "SLE",
          },
          source: {
            financialAccountId: campaign.financial_account.id,
          },
          metadata: {
            campaignId: input.campaignId.toString(),
            payoutId: payout.id,
          },
        };

        // Create payout with Monime
        const idempotencyKey = randomUUID();
        const monimePayout = await monimeService.createPayout(
          monimeRequest,
          idempotencyKey
        );

        // Update payout with Monime ID
        const updatedPayout = await payoutRepository.updateById(
          payout.id,
          { $set: { monimePayoutId: monimePayout.id } } as never,
          txn
        );

        return updatedPayout || payout;
      } catch (monimeError) {
        // Update payout status to failed if Monime call fails
        await payoutRepository.updateById(
          payout.id,
          {
            $set: {
              status: "failed",
              failureReason:
                monimeError instanceof Error
                  ? monimeError.message
                  : "Unknown error",
            },
          } as never,
          txn
        );
        throw new Error(
          `Payout failed: ${
            monimeError instanceof Error ? monimeError.message : "Unknown error"
          }`
        );
      }
    });
  }

  async markPaid(payoutId: string, session?: ServiceSession): Promise<IPayout> {
    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) throw new Error("Payout not found");
      if (payout.status === "paid") return payout;
      if (payout.status === "rejected")
        throw new Error("Cannot pay a rejected payout");

      const updated = await payoutRepository.updateById(
        payout.id,
        { $set: { status: "paid" } } as never,
        txn
      );
      if (!updated) throw new Error("Failed to update payout status");

      // Update campaign withdrawals
      const incUpdate: Record<string, number> = {
        "withdrawals.totalPaidMinor": payout.amountMinor,
        "withdrawals.count": 1,
      };
      await campaignRepository.updateById(
        payout.campaignId.toString(),
        { $inc: incUpdate as never } as never,
        txn
      );

      // Ledger entry
      await ledgerEntryRepository.create(
        {
          campaignId: payout.campaignId,
          refType: "payout",
          refId: payout._id,
          direction: "out",
          amountMinor: payout.amountMinor,
          currency: "UGX", // Consider storing per-campaign/base currency; adjust as needed
        } as unknown as Partial<import("../models/LedgerEntry").ILedgerEntry>,
        txn
      );

      return updated;
    }, session);
  }

  async updatePayoutStatus(
    monimePayoutId: string,
    status: string,
    failureReason?: string
  ): Promise<IPayout | null> {
    const payout = await payoutRepository.findOne({ monimePayoutId });
    if (!payout) {
      console.warn(`Payout not found for Monime payout ID: ${monimePayoutId}`);
      return null;
    }

    const statusMap: Record<string, IPayout["status"]> = {
      pending: "processing",
      processing: "processing",
      completed: "completed",
      failed: "failed",
      cancelled: "cancelled",
    };

    const newStatus = statusMap[status] || "failed";

    return runInTransaction<IPayout>(async (txn) => {
      // Update payout status
      const updateFields: Record<string, unknown> = { status: newStatus };
      if (failureReason) {
        updateFields.failureReason = failureReason;
      }

      const updated = await payoutRepository.updateById(
        payout.id,
        { $set: updateFields } as never,
        txn
      );
      if (!updated) throw new Error("Failed to update payout status");

      // If completed, update campaign withdrawals and create ledger entry
      if (newStatus === "completed") {
        const incUpdate: Record<string, number> = {
          "withdrawals.totalPaidMinor": payout.amountMinor,
          "withdrawals.count": 1,
        };
        await campaignRepository.updateById(
          payout.campaignId.toString(),
          { $inc: incUpdate as never } as never,
          txn
        );

        // Ledger entry
        await ledgerEntryRepository.create(
          {
            campaignId: payout.campaignId,
            refType: "payout",
            refId: payout._id,
            direction: "out",
            amountMinor: payout.amountMinor,
            currency: "SLE", // Consider storing per-campaign currency
          } as unknown as Partial<import("../models/LedgerEntry").ILedgerEntry>,
          txn
        );
      }

      return updated;
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
    return payoutRepository.listForAdmin(filters, options);
  }

  async getAnalytics(dateFrom?: Date, dateTo?: Date): Promise<{
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
    return payoutRepository.getAnalyticsByDateRange(dateFrom, dateTo);
  }

  async getMethodBreakdown(dateFrom?: Date, dateTo?: Date): Promise<Array<{
    method: string;
    count: number;
    amount: number;
    successRate: number;
  }>> {
    return payoutRepository.getMethodBreakdown(dateFrom, dateTo);
  }

  async getTopCampaignsByPayouts(limit: number = 10): Promise<Array<{
    campaignId: string;
    campaignName: string;
    totalAmount: number;
    payoutCount: number;
    lastPayout: Date;
  }>> {
    return payoutRepository.getTopCampaignsByPayouts(limit);
  }

  async getPendingApprovals(): Promise<IPayout[]> {
    return payoutRepository.getPendingApprovals();
  }

  async getPayoutsByStatus(): Promise<Array<{
    status: string;
    count: number;
    amount: number;
  }>> {
    return payoutRepository.getPayoutsByStatus();
  }

  async getById(payoutId: string): Promise<IPayout | null> {
    return payoutRepository.findById(payoutId);
  }

  async approvePayout(
    payoutId: string,
    adminId: mongoose.Types.ObjectId,
    note?: string,
    auditContext?: { ip?: string; userAgent?: string },
    session?: ServiceSession
  ): Promise<IPayout> {
    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      if (!["processing", "in_review", "threshold_review"].includes(payout.status)) {
        throw new Error("Payout cannot be approved in current status");
      }

      const previousStatus = payout.status;
      const approval: IPayoutApproval = {
        adminId,
        action: "approved",
        note,
        at: new Date()
      };

      const updated = await payoutRepository.updateById(
        payoutId,
        {
          $set: { status: "approved" },
          $push: { approvals: approval }
        } as never,
        txn
      );

      if (!updated) {
        throw new Error("Failed to approve payout");
      }

      // Create audit log for payout approval
      await auditLogService.record({
        actor: {
          userId: adminId,
          role: "admin"
        },
        action: "payout.approved",
        target: {
          type: "payout",
          id: new mongoose.Types.ObjectId(payoutId)
        },
        diff: {
          previousStatus,
          newStatus: "approved",
          note,
          amountMinor: payout.amountMinor,
          campaignId: payout.campaignId.toString()
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      return updated;
    }, session);
  }

  async rejectPayout(
    payoutId: string,
    adminId: mongoose.Types.ObjectId,
    reason: string,
    session?: ServiceSession
  ): Promise<IPayout> {
    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      if (!["processing", "in_review", "approved"].includes(payout.status)) {
        throw new Error("Payout cannot be rejected in current status");
      }

      const approval: IPayoutApproval = {
        adminId,
        action: "rejected",
        note: reason,
        at: new Date()
      };

      const updated = await payoutRepository.updateById(
        payoutId,
        {
          $set: { 
            status: "rejected",
            failureReason: reason
          },
          $push: { approvals: approval }
        } as never,
        txn
      );

      if (!updated) {
        throw new Error("Failed to reject payout");
      }

      return updated;
    }, session);
  }

  async processPayout(
    payoutId: string,
    adminId: mongoose.Types.ObjectId,
    session?: ServiceSession
  ): Promise<IPayout> {
    // Check if withdrawals are globally blocked (blocks even approved payouts)
    const blockStatus = await this.isWithdrawalsBlocked();
    if (blockStatus.blocked) {
      const message = blockStatus.reason
        ? `Cannot process payout: Withdrawals are blocked - ${blockStatus.reason}`
        : "Cannot process payout: Withdrawals are currently blocked.";
      throw new Error(message);
    }

    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      if (payout.status !== "approved") {
        throw new Error("Only approved payouts can be processed");
      }

      // Get campaign to verify financial account
      const campaign = await campaignRepository.findById(payout.campaignId.toString());
      if (!campaign?.financial_account?.id) {
        throw new Error("Campaign financial account not found");
      }

      try {
        // Helper function to determine mobile money provider
        const getMobileMoneyProvider = (phoneNumber: string): string => {
          const cleanNumber = phoneNumber.replace(/^(\+232|232|0)/, "");
          if (/^7[678]/.test(cleanNumber)) return "m17"; // Orange Money
          if (/^(79|3[0-4])/.test(cleanNumber)) return "m18"; // AfriMoney
          return "m17"; // Default
        };

        // Prepare Monime payout request
        let destination: MonimePayoutRequest["destination"];

        if (payout.method.type === "mobile_money") {
          const method = payout.method as { type: "mobile_money"; msisdn?: string; provider?: string };
          destination = {
            type: "momo",
            providerId: method.provider || getMobileMoneyProvider(method.msisdn || ""),
            phoneNumber: method.msisdn,
          };
        } else {
          const method = payout.method as { type: "bank"; providerId?: string; accountNumber?: string; accountName?: string };
          destination = {
            type: "bank",
            providerId: method.providerId,
            accountNumber: method.accountNumber,
            accountName: method.accountName,
          };
        }

        const monimeRequest: MonimePayoutRequest = {
          destination,
          amount: {
            value: payout.amountMinor,
            currency: campaign.goal?.currency ?? "SLE",
          },
          source: {
            financialAccountId: campaign.financial_account.id,
          },
          metadata: {
            campaignId: payout.campaignId.toString(),
            payoutId: payout.id,
          },
        };

        // Create payout with Monime
        const idempotencyKey = randomUUID();
        const monimePayout = await monimeService.createPayout(
          monimeRequest,
          idempotencyKey
        );

        // Update payout with processing status and Monime ID
        const updated = await payoutRepository.updateById(
          payoutId,
          {
            $set: {
              status: "processing",
              monimePayoutId: monimePayout.id
            }
          } as never,
          txn
        );

        if (!updated) {
          throw new Error("Failed to update payout with Monime ID");
        }

        return updated;
      } catch (monimeError) {
        // Update payout status to failed if Monime call fails
        const updated = await payoutRepository.updateById(
          payoutId,
          {
            $set: {
              status: "failed",
              failureReason: monimeError instanceof Error ? monimeError.message : "Processing failed"
            }
          } as never,
          txn
        );

        throw new Error(
          `Payout processing failed: ${
            monimeError instanceof Error ? monimeError.message : "Unknown error"
          }`
        );
      }
    }, session);
  }

  async cancelPayout(
    payoutId: string,
    adminId: mongoose.Types.ObjectId,
    reason: string,
    session?: ServiceSession
  ): Promise<IPayout> {
    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      if (["completed", "paid"].includes(payout.status)) {
        throw new Error("Cannot cancel completed payout");
      }

      const approval: IPayoutApproval = {
        adminId,
        action: "rejected",
        note: `Cancelled: ${reason}`,
        at: new Date()
      };

      const updated = await payoutRepository.updateById(
        payoutId,
        {
          $set: {
            status: "cancelled",
            failureReason: `Cancelled by admin: ${reason}`
          },
          $push: { approvals: approval }
        } as never,
        txn
      );

      if (!updated) {
        throw new Error("Failed to cancel payout");
      }

      return updated;
    }, session);
  }

  async addPaymentProof(
    payoutId: string,
    proofUrl: string,
    adminId: mongoose.Types.ObjectId,
    session?: ServiceSession
  ): Promise<IPayout> {
    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      const updated = await payoutRepository.updateById(
        payoutId,
        {
          $set: {
            paymentProofUrl: proofUrl,
            status: "completed" // Mark as completed when proof is added
          }
        } as never,
        txn
      );

      if (!updated) {
        throw new Error("Failed to add payment proof");
      }

      // Update campaign withdrawals and create ledger entry
      const incUpdate: Record<string, number> = {
        "withdrawals.totalPaidMinor": payout.amountMinor,
        "withdrawals.count": 1,
      };
      await campaignRepository.updateById(
        payout.campaignId.toString(),
        { $inc: incUpdate as never } as never,
        txn
      );

      // Create ledger entry
      await ledgerEntryRepository.create(
        {
          campaignId: payout.campaignId,
          refType: "payout",
          refId: payout._id,
          direction: "out",
          amountMinor: payout.amountMinor,
          currency: "SLE", // TODO: Use campaign currency
          description: `Payout completed with proof: ${proofUrl.split('/').pop()}`,
        } as unknown as Partial<import("../models/LedgerEntry").ILedgerEntry>,
        txn
      );

      return updated;
    }, session);
  }

  async overrideThreshold(
    payoutId: string,
    adminId: mongoose.Types.ObjectId,
    reason: string,
    auditContext?: { ip?: string; userAgent?: string },
    session?: ServiceSession
  ): Promise<IPayout> {
    return runInTransaction<IPayout>(async (txn) => {
      const payout = await payoutRepository.findById(payoutId);
      if (!payout) {
        throw new Error("Payout not found");
      }

      if (payout.status !== "threshold_review") {
        throw new Error("Can only override threshold for payouts in threshold review");
      }

      const previousStatus = payout.status;
      const previousThresholdMet = payout.policyCheck?.minThresholdMet ?? false;

      const updated = await payoutRepository.updateById(
        payoutId,
        {
          $set: {
            "policyCheck.overrideBy": adminId,
            "policyCheck.minThresholdMet": true,
            status: "approved" // Auto-approve when threshold is overridden
          }
        } as never,
        txn
      );

      if (!updated) {
        throw new Error("Failed to override threshold");
      }

      // Add approval record
      const approval: IPayoutApproval = {
        adminId,
        action: "approved",
        note: `Threshold override: ${reason}`,
        at: new Date()
      };

      await payoutRepository.updateById(
        payoutId,
        { $push: { approvals: approval } } as never,
        txn
      );

      // Create comprehensive audit log for threshold override
      await auditLogService.record({
        actor: {
          userId: adminId,
          role: "admin"
        },
        action: "payout.threshold_overridden",
        target: {
          type: "payout",
          id: new mongoose.Types.ObjectId(payoutId)
        },
        diff: {
          previousStatus,
          newStatus: "approved",
          previousThresholdMet,
          newThresholdMet: true,
          overrideReason: reason,
          amountMinor: payout.amountMinor,
          campaignId: payout.campaignId.toString(),
          overrideBy: adminId.toString()
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      return updated;
    }, session);
  }
}

export const payoutService = new PayoutService();
