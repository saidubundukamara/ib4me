import mongoose from "mongoose";
import {
  payoutRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IPayout, IPayoutApproval, IPayoutPolicyCheck } from "../models/Payout";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";
import { monimeService, MonimePayoutRequest, MonimeApiError } from "../lib/monime";
import { resolveMobileOperator } from "../lib/mobileMoney";

import type { PayoutFilters, PayoutListOptions } from "../repositories/PayoutRepository";
import { auditLogService } from "./AuditLogService";
import { settingService } from "./SettingService";
import { computePayoutSplit, requiredDebitMinor, sumMonimeFees } from "../lib/fees";

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
   * The fail-closed gate every payout passes through before any money moves.
   *
   * Three things it will not do:
   *
   * - **Trust our own ledger alone.** Every figure derived from our database is ours to
   *   get wrong; the provider's balance is not. The payout is bounded by
   *   `min(ledger, provider)` and any divergence is logged in both directions — under
   *   means money we believe we hold isn't there, over means money arrived we never
   *   booked. We cap at the ledger in the second case, because paying out unbooked money
   *   is just a different hole (MONIME-FEE-MODEL.md R8).
   * - **Compare currencies implicitly.** A balance held in another currency measured
   *   against SLE minor units is arithmetic nonsense, not a small discrepancy.
   * - **Fail open.** An unreadable or absent balance refuses the payout. This costs no
   *   availability: a Monime we cannot read from is one we cannot `createPayout` against
   *   either, and failing open would let anyone who can break the read switch the guard
   *   off.
   */
  private async assertSufficientBalance(
    financialAccountId: string,
    amountMinor: number,
    currency: string,
    campaignId?: mongoose.Types.ObjectId
  ): Promise<void> {
    const account = await monimeService.getFinancialAccount(financialAccountId);

    const balance = account?.balance?.available;
    if (balance === null || balance === undefined) {
      throw new Error(
        "Could not confirm your balance with the payment provider. Please try again shortly."
      );
    }
    if (typeof balance === "object" && balance.currency && balance.currency !== currency) {
      throw new Error(
        `This account is held in ${balance.currency}, not ${currency}. Withdrawal refused.`
      );
    }

    const providerMinor = monimeService.getAccountBalanceMinor(account);

    // What must be present to send `amountMinor` — see PAYOUT_FEE_CHARGED_ON_TOP. Monime
    // is documented to take its fee out of the amount sent, in which case this is just
    // `amountMinor` and a full-balance withdrawal is legal.
    const payoutFeeBps = await settingService.getPayoutFeeEstimateBps();
    const requiredMinor = requiredDebitMinor(amountMinor, payoutFeeBps);

    // Bound by our own books too, and shout if the two disagree.
    let effectiveAvailable = providerMinor;
    if (campaignId) {
      const ledger = await ledgerEntryRepository.getCampaignBalance(campaignId);
      if (ledger.balance !== providerMinor) {
        console.warn("[payout] balance divergence", {
          financialAccountId,
          campaignId: campaignId.toString(),
          ledgerMinor: ledger.balance,
          providerMinor,
          direction: providerMinor < ledger.balance ? "provider_short" : "provider_over",
        });
      }
      effectiveAvailable = Math.min(providerMinor, ledger.balance);
    }

    console.log("[payout] balance pre-flight", {
      financialAccountId,
      providerMinor,
      effectiveAvailable,
      amountMinor,
      requiredMinor,
      currency,
      sufficient: effectiveAvailable >= requiredMinor,
    });

    if (effectiveAvailable < requiredMinor) {
      const fmt = (minor: number) => `${currency} ${(minor / 100).toFixed(2)}`;
      throw new Error(
        `Insufficient funds in payout account. Available ${fmt(effectiveAvailable)}, requested ${fmt(requiredMinor)}.`
      );
    }
  }

  /**
   * What a withdrawal of `amountMinor` will actually pay out, for the confirm screen.
   *
   * Quoted up front and never a silent deduction: mobile-money providers charge on every
   * withdrawal, and the owner must see "requested X · fee Y · you receive Z" before they
   * commit (MONIME-FEE-MODEL.md §8.7). The fee here is an ESTIMATE — the exact figure is
   * confirmed from `payout.completed` and written to the payout row at completion.
   */
  async quotePayout(
    campaignId: string,
    amountMinor: number
  ): Promise<{
    currency: string;
    availableMinor: number;
    requestedMinor: number;
    payoutFeeBps: number;
    estimatedFeeMinor: number;
    estimatedNetMinor: number;
    requiredDebitMinor: number;
    minPayoutMinor: number;
    thresholdEnabled: boolean;
    note: string;
  }> {
    const campaign = await campaignRepository.findById(campaignId);
    const currency = campaign?.goal?.currency ?? "SLE";
    const payoutFeeBps = await settingService.getPayoutFeeEstimateBps();
    const withdrawalSettings = await settingService.getWithdrawalSettings();
    const availableMinor = await this.getAvailableBalanceMinor(campaignId);

    const split = computePayoutSplit({
      requestedMinor: amountMinor,
      payoutFeeBpsFallback: payoutFeeBps,
    });

    return {
      currency,
      availableMinor,
      requestedMinor: split.requestedMinor,
      payoutFeeBps,
      estimatedFeeMinor: split.feeMinor,
      estimatedNetMinor: split.netAmountMinor,
      requiredDebitMinor: requiredDebitMinor(amountMinor, payoutFeeBps),
      minPayoutMinor: withdrawalSettings.minAmountMinor,
      thresholdEnabled: withdrawalSettings.thresholdEnabled,
      note:
        "Mobile money providers charge a fee on every withdrawal. The exact amount is " +
        "confirmed when the payout settles.",
    };
  }

  /**
   * Authoritative available balance for a campaign: the REAL balance of its
   * Monime financial account (where donation funds are settled), NOT the
   * MongoDB raised−paid figure. This is what the withdrawal UI should display
   * and what gates a withdrawal request.
   */
  async getAvailableBalanceMinor(campaignId: string): Promise<number> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign?.financial_account?.id) {
      // No funding account yet → nothing is withdrawable.
      return 0;
    }
    const account = await monimeService.getFinancialAccount(
      campaign.financial_account.id
    );
    return monimeService.getAccountBalanceMinor(account);
  }

  /**
   * Apply the one-time side-effects of a completed payout: bump the campaign's
   * withdrawal counters and write the "out" ledger entry. Idempotent — the
   * synchronous disburse response and the payout.completed webhook may both
   * reach this, so we atomically claim completion via `completionApplied` and
   * only the first caller does the work.
   */
  private async applyPayoutCompletion(
    payout: IPayout,
    txn: ServiceSession,
    opts?: { monimeFeeMinor?: number | null }
  ): Promise<void> {
    const claim = await payoutRepository.updateOne(
      { _id: payout.id, completionApplied: { $ne: true } } as never,
      { $set: { completionApplied: true } } as never,
      txn
    );
    if (claim.modifiedCount !== 1) {
      // Another path already applied the completion side-effects.
      return;
    }

    const campaign = await campaignRepository.findById(
      payout.campaignId.toString()
    );
    const currency = payout.currency || campaign?.goal?.currency || "SLE";

    // Monime takes its cut out of the amount we sent, so the owner receives less than
    // they requested. Record BOTH figures, at completion, from what Monime actually
    // reported — a configured rate is only a fallback (R12/R13).
    const split = computePayoutSplit({
      requestedMinor: payout.amountMinor,
      payoutFeeMinor: opts?.monimeFeeMinor,
      payoutFeeBpsFallback: await settingService.getPayoutFeeEstimateBps(),
    });

    await payoutRepository.updateById(
      payout.id,
      {
        $set: {
          feeMinor: split.feeMinor,
          netAmountMinor: split.netAmountMinor,
          feeSource: split.feeSource,
        },
      } as never,
      txn
    );

    await campaignRepository.updateById(
      payout.campaignId.toString(),
      {
        $inc: {
          "withdrawals.totalPaidMinor": payout.amountMinor,
          "withdrawals.count": 1,
        } as never,
      } as never,
      txn
    );

    // The FULL requested amount left the campaign's balance — net to the owner, fee to
    // Monime. The fee is deliberately NOT a ledger account: it was never platform money,
    // it came out of a balance the campaign already owned (R7). It lives as columns on
    // the payout row instead.
    await ledgerEntryRepository.createIdempotent(
      {
        campaignId: payout.campaignId,
        accountType: "campaign",
        refType: "payout",
        refId: payout._id as mongoose.Types.ObjectId,
        direction: "out",
        amountMinor: payout.amountMinor,
        currency,
        monimeRef: payout.monimePayoutId ?? null,
        description: `Withdrawal ${payout.id}`,
      },
      `payout:${payout.id}`,
      txn
    );
  }

  /** Map a Monime payout status to our payout status enum. */
  private mapMonimeStatus(status?: string): IPayout["status"] {
    switch (status) {
      case "completed":
        return "completed";
      case "failed":
        return "failed";
      case "cancelled":
        return "cancelled";
      default:
        return "processing";
    }
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

    console.log("[payout] requestPayout start", {
      campaignId: input.campaignId.toString(),
      requestedBy: input.requestedBy.toString(),
      amountMinor: input.amountMinor,
      methodType: input.method?.type,
    });

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

      // Verify sufficient funds against the REAL Monime balance of the
      // campaign's financial account (the single source of truth), not the
      // MongoDB raised−paid figure which can overstate what has actually
      // settled into the account.
      await this.assertSufficientBalance(
        campaign.financial_account.id,
        input.amountMinor,
        campaign.goal?.currency ?? "SLE",
        input.campaignId
      );

      // Check minimum withdrawal threshold
      const policyCheck = await this.checkMinimumThreshold(
        input.amountMinor,
        input.campaignId,
        settings
      );

      // Determine initial status based on threshold check
      const initialStatus = policyCheck.minThresholdMet ? "processing" : "threshold_review";

      console.log("[payout] threshold check", {
        campaignId: input.campaignId.toString(),
        amountMinor: input.amountMinor,
        raisedMinor: campaign.totals?.raisedMinor ?? 0,
        minThresholdMet: policyCheck.minThresholdMet,
        initialStatus,
      });

      // Create payout record first
      // `quotedFeeMinor` records what the owner was shown when they confirmed, so a
      // later dispute can be settled against the number they actually saw. The
      // authoritative fee is written at completion from what Monime reports (R7/R12).
      const quotedFee = computePayoutSplit({
        requestedMinor: input.amountMinor,
        payoutFeeBpsFallback: await settingService.getPayoutFeeEstimateBps(),
      });

      const payout = await payoutRepository.create(
        {
          campaignId: input.campaignId,
          requestedBy: input.requestedBy,
          amountMinor: input.amountMinor,
          currency: campaign.goal?.currency ?? "SLE",
          quotedFeeMinor: quotedFee.feeMinor,
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

        console.warn("[payout] below threshold — parked for admin review, NOT sent to Monime", {
          payoutId: payout.id,
          amountMinor: input.amountMinor,
          minThreshold: settings?.minimumWithdrawalAmount ?? 50000,
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

        // Balance was already verified against the real Monime account balance
        // above (before the payout row was created).

        // Create payout with Monime
        // DETERMINISTIC, keyed on the payout row. A fresh `randomUUID()` per attempt —
        // which this used to be — defeats Monime's idempotency entirely: every retry
        // reads as a brand-new payout request, so retrying one that had actually
        // succeeded would send the money a second time.
        const idempotencyKey = `payout_${payout.id}`;
        console.log("[payout] sending to Monime", {
          payoutId: payout.id,
          destinationType: monimeRequest.destination.type,
          providerId: monimeRequest.destination.providerId,
          amountMinor: monimeRequest.amount.value,
          currency: monimeRequest.amount.currency,
          sourceFinancialAccountId: monimeRequest.source.financialAccountId,
          idempotencyKey,
        });
        const monimePayout = await monimeService.createPayout(
          monimeRequest,
          idempotencyKey
        );

        // Reflect an immediate terminal status from Monime rather than leaving
        // the row stuck on "processing".
        const reconciledStatus = this.mapMonimeStatus(monimePayout.status);
        console.log("[payout] Monime responded", {
          payoutId: payout.id,
          monimePayoutId: monimePayout.id,
          monimeStatus: monimePayout.status,
          reconciledStatus,
        });
        const updatedPayout = await payoutRepository.updateById(
          payout.id,
          {
            $set: {
              monimePayoutId: monimePayout.id,
              status: reconciledStatus,
              ...(reconciledStatus === "failed"
                ? {
                    failureReason:
                      monimePayout.failureReason ||
                      "Monime rejected the payout",
                  }
                : {}),
            },
          } as never,
          txn
        );

        // If Monime settled the payout synchronously, apply the completion
        // side-effects now (idempotent — webhook may also fire later).
        if (reconciledStatus === "completed") {
          // A synchronous completion may already carry the fee; if not, the
          // payout.completed webhook supplies it later.
          await this.applyPayoutCompletion(updatedPayout || payout, txn, {
            monimeFeeMinor: sumMonimeFees(monimePayout.fees),
          });
        }

        return updatedPayout || payout;
      } catch (monimeError) {
        const errDetails =
          monimeError instanceof MonimeApiError
            ? {
                code: monimeError.code,
                statusCode: monimeError.statusCode,
                details: monimeError.details,
              }
            : undefined;
        console.error("[payout] Monime call failed", {
          payoutId: payout.id,
          message:
            monimeError instanceof Error ? monimeError.message : "Unknown error",
          ...errDetails,
        });
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

      // Route through the single completion path, which holds the atomic
      // `completionApplied` claim. This used to duplicate the counter increment and the
      // ledger write inline, bypassing that claim — so an admin marking an
      // already-completed payout as paid double-counted the withdrawal AND wrote a second
      // ledger row. It also hardcoded `currency: "UGX"` on a Sierra Leone platform.
      await this.applyPayoutCompletion(updated, txn);

      return updated;
    }, session);
  }

  async updatePayoutStatus(
    monimePayoutId: string,
    status: string,
    failureReason?: string,
    /** Monime's reported payout fee. `null`/omitted = not reported, never zero. */
    opts?: { monimeFeeMinor?: number | null }
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

      // If completed, apply the one-time withdrawal-counter + ledger side-effects.
      // Idempotent: a duplicate payout.completed webhook (or a sync disburse that
      // already applied it) is a no-op and cannot double-count.
      if (newStatus === "completed") {
        await this.applyPayoutCompletion(updated, txn, {
          monimeFeeMinor: opts?.monimeFeeMinor,
        });
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

        // Verify the real Monime balance of the source account before paying out.
        await this.assertSufficientBalance(
          campaign.financial_account.id,
          payout.amountMinor,
          campaign.goal?.currency ?? "SLE",
          payout.campaignId
        );

        // Create payout with Monime — same deterministic key as requestPayout, so the
        // two paths cannot create two Monime payouts for one payout row.
        const idempotencyKey = `payout_${payoutId}`;
        console.log("[payout] processPayout sending to Monime", {
          payoutId,
          destinationType: monimeRequest.destination.type,
          providerId: monimeRequest.destination.providerId,
          amountMinor: monimeRequest.amount.value,
          currency: monimeRequest.amount.currency,
          sourceFinancialAccountId: monimeRequest.source.financialAccountId,
          idempotencyKey,
        });
        const monimePayout = await monimeService.createPayout(
          monimeRequest,
          idempotencyKey
        );

        // Reflect an immediate terminal status rather than forcing "processing".
        const reconciledStatus = this.mapMonimeStatus(monimePayout.status);
        console.log("[payout] processPayout Monime responded", {
          payoutId,
          monimePayoutId: monimePayout.id,
          monimeStatus: monimePayout.status,
          reconciledStatus,
        });
        const updated = await payoutRepository.updateById(
          payoutId,
          {
            $set: {
              status: reconciledStatus,
              monimePayoutId: monimePayout.id,
              ...(reconciledStatus === "failed"
                ? {
                    failureReason:
                      monimePayout.failureReason ||
                      "Monime rejected the payout",
                  }
                : {}),
            }
          } as never,
          txn
        );

        if (!updated) {
          throw new Error("Failed to update payout with Monime ID");
        }

        // If Monime settled the payout synchronously, apply the completion
        // side-effects now (idempotent — webhook may also fire later).
        if (reconciledStatus === "completed") {
          await this.applyPayoutCompletion(updated, txn);
        }

        return updated;
      } catch (monimeError) {
        const errDetails =
          monimeError instanceof MonimeApiError
            ? {
                code: monimeError.code,
                statusCode: monimeError.statusCode,
                details: monimeError.details,
              }
            : undefined;
        console.error("[payout] processPayout Monime call failed", {
          payoutId,
          message:
            monimeError instanceof Error ? monimeError.message : "Unknown error",
          ...errDetails,
        });
        // Update payout status to failed if Monime call fails
        await payoutRepository.updateById(
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

      // Route through the single completion path, which holds the atomic
      // `completionApplied` claim. This used to increment the withdrawal counter and
      // write the ledger row inline, bypassing that claim — so adding proof to a payout
      // that had already completed via webhook double-counted both. It also hardcoded the
      // currency.
      await this.applyPayoutCompletion(updated, txn);

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
