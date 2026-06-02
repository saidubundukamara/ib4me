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
import { monimeService } from "../lib/monime";
import { settingService } from "./SettingService";

export type ReconcileAction =
  | "advanced_to_succeeded"
  | "advanced_to_payment_received"
  | "marked_failed"
  | "skipped_no_session"
  | "skipped_not_pending"
  | "skipped_session_pending"
  | "skipped_dry_run"
  | "error";

export interface ReconcileResult {
  donationId: string;
  action: ReconcileAction;
  fromStatus: string;
  toStatus: string;
  monimeSessionStatus?: string;
  reason?: string;
}

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
      const enteredFromPending = donation.status === "pending";

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

      // Normal flow: campaign totals were already incremented in markPaymentReceived().
      // Idempotency-branch flow (e.g. webhook/process-transfer recovering a donation
      // whose transfer was completed externally but whose status was still pending):
      // markPaymentReceived was skipped, so we must update totals here to avoid silent loss.
      if (enteredFromPending) {
        await campaignRepository.updateById(
          donation.campaignId.toString(),
          {
            $inc: {
              "totals.raisedMinor": campaignReceivesAmount,
              "totals.donationCount": 1,
            } as never,
            $set: { "totals.lastDonationAt": new Date() } as never,
          } as never,
          txn
        );
      }

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

  /**
   * Create (or resume) the internal transfer that moves a settled donation from
   * the platform account to the campaign's financial account, then poll it to a
   * terminal state. Idempotent via the deterministic `donation_transfer_<id>`
   * key — Monime returns the existing transfer if one was already created, so
   * this both initiates new transfers and finishes ones left pending.
   *
   * Shared by the payment webhook, the success-redirect handler, and the
   * reconciliation sweep so they cannot diverge. The campaign account is read
   * from the campaign record (authoritative) rather than checkout metadata.
   */
  async settleTransfer(
    donationId: string,
    opts?: { source?: string; maxAttempts?: number; pollIntervalMs?: number }
  ): Promise<{
    status: "completed" | "failed" | "pending";
    transferId?: string;
    reason?: string;
  }> {
    const donation = await donationRepository.findById(donationId);
    if (!donation) throw new Error("Donation not found");

    // Already settled — make sure the donation is marked succeeded and stop.
    if (donation.status === "succeeded") {
      return { status: "completed", transferId: donation.transfer?.id };
    }
    if (donation.transfer?.status === "completed" && donation.transfer.id) {
      await this.completeWithTransfer(donationId, donation.transfer.id);
      return { status: "completed", transferId: donation.transfer.id };
    }

    // Resolve source (platform) and destination (campaign) accounts.
    const campaign = await campaignRepository.findById(
      donation.campaignId.toString()
    );
    const campaignFinancialAccountId = campaign?.financial_account?.id;
    if (!campaignFinancialAccountId) {
      await this.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Campaign financial account not set",
        initiatedAt: new Date(),
      });
      return { status: "failed", reason: "missing campaign financial account" };
    }
    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      await this.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Platform financial account not configured",
        initiatedAt: new Date(),
      });
      return { status: "failed", reason: "platform account not configured" };
    }

    const source = opts?.source ?? "settle";
    const maxAttempts = opts?.maxAttempts ?? 10;
    const pollIntervalMs = opts?.pollIntervalMs ?? 1000;
    const idempotencyKey = `donation_transfer_${donationId}`;
    const transferAmount = donation.amount.minor; // fees are charged on top

    try {
      await this.updateTransferStatus(donationId, {
        status: "pending",
        initiatedAt: donation.transfer?.initiatedAt ?? new Date(),
        retryCount: donation.transfer?.retryCount ?? 0,
      });

      // createInternalTransfer returns the unwrapped transfer (top-level id/status).
      const created = await monimeService.createInternalTransfer(
        {
          amount: { currency: donation.amount.currency, value: transferAmount },
          sourceFinancialAccount: { id: platformAccount.id },
          destinationFinancialAccount: { id: campaignFinancialAccountId },
          description: `Donation transfer for ${donationId}`,
          metadata: { donationId, type: "donation_transfer", source },
        },
        idempotencyKey
      );

      let status: string = created.status;
      let transferId = created.id;
      let failureReason = created.failureReason;

      // Internal transfers may settle asynchronously — poll to a terminal state.
      // getInternalTransfer returns the WRAPPED body (read via .result).
      for (
        let i = 0;
        i < maxAttempts && (status === "pending" || status === "processing");
        i++
      ) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        const polled = await monimeService.getInternalTransfer(transferId);
        status = polled.result.status;
        transferId = polled.result.id;
        failureReason = polled.result.failureReason;
      }

      if (status === "completed") {
        await this.completeWithTransfer(donationId, transferId);
        return { status: "completed", transferId };
      }
      if (status === "failed") {
        await this.updateTransferStatus(donationId, {
          id: transferId,
          status: "failed",
          failureReason: failureReason || "Transfer failed",
          retryCount: (donation.transfer?.retryCount ?? 0) + 1,
        });
        return { status: "failed", transferId, reason: failureReason };
      }

      // Still pending after polling — leave it for the next reconciliation tick.
      await this.updateTransferStatus(donationId, {
        id: transferId,
        status: "pending",
      });
      return { status: "pending", transferId };
    } catch (transferError) {
      const message =
        transferError instanceof Error
          ? transferError.message
          : "Transfer API error";
      await this.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: message,
        retryCount: (donation.transfer?.retryCount ?? 0) + 1,
      });
      return { status: "failed", reason: message };
    }
  }

  /**
   * Donations whose payment has settled but whose transfer to the campaign
   * account has not completed. Used by the reconciliation sweep to move funds
   * that are stuck in the platform account.
   */
  async getDonationsWithUnsettledTransfer(limit: number = 100): Promise<IDonation[]> {
    return donationRepository.findMany(
      {
        status: "payment_received",
        $or: [
          { transfer: { $exists: false } },
          { "transfer.status": { $ne: "completed" } },
        ],
      } as never,
      { query: { sort: { createdAt: 1 }, limit } as never }
    );
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

  /**
   * List pending donations that have a Monime checkout session and are old
   * enough to be safely reconciled (i.e. not still mid-flow).
   */
  async listPendingNeedingReconciliation(maxAgeMinutes: number = 10): Promise<IDonation[]> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    return donationRepository.findMany({
      status: "pending",
      "provider.checkoutSessionId": { $exists: true, $ne: null },
      createdAt: { $lt: cutoff },
    } as never, { query: { sort: { createdAt: 1 } } });
  }

  /**
   * Reconcile a single pending donation against Monime's authoritative checkout
   * session state. Used by the cron reconciliation route to recover donations
   * whose webhook was missed (common for mobile-money / USSD donors who never
   * return to the browser, so /success and /[id]/status don't fire either).
   *
   * Mirrors the post-payment flow from app/api/donations/webhook/route.ts
   * (handlePaymentCompleted) — markPaymentReceived → internal transfer →
   * completeWithTransfer — but driven by the cron loop instead of a webhook.
   */
  async advanceFromCheckoutSession(
    donationId: string,
    options: { dryRun?: boolean } = {}
  ): Promise<ReconcileResult> {
    const dryRun = options.dryRun === true;
    const donation = await donationRepository.findById(donationId);
    if (!donation) throw new Error(`Donation ${donationId} not found`);

    if (donation.status !== "pending") {
      return {
        donationId,
        action: "skipped_not_pending",
        fromStatus: donation.status,
        toStatus: donation.status,
        reason: `donation is ${donation.status}`,
      };
    }

    const checkoutSessionId = donation.provider?.checkoutSessionId;
    if (!checkoutSessionId) {
      return {
        donationId,
        action: "skipped_no_session",
        fromStatus: "pending",
        toStatus: "pending",
        reason: "no checkout session id",
      };
    }

    const session = await monimeService.getCheckoutSession(checkoutSessionId);
    const sessionStatus = session.result?.status;

    if (sessionStatus === "failed" || sessionStatus === "cancelled") {
      if (dryRun) {
        return {
          donationId,
          action: "skipped_dry_run",
          fromStatus: "pending",
          toStatus: "failed",
          monimeSessionStatus: sessionStatus,
          reason: `would mark failed (Monime: ${sessionStatus})`,
        };
      }
      await this.markFailed(donationId, `Reconciliation: Monime reported ${sessionStatus}`);
      return {
        donationId,
        action: "marked_failed",
        fromStatus: "pending",
        toStatus: "failed",
        monimeSessionStatus: sessionStatus,
      };
    }

    if (sessionStatus !== "completed") {
      return {
        donationId,
        action: "skipped_session_pending",
        fromStatus: "pending",
        toStatus: "pending",
        monimeSessionStatus: sessionStatus,
        reason: `Monime session not completed (${sessionStatus ?? "unknown"})`,
      };
    }

    if (dryRun) {
      return {
        donationId,
        action: "skipped_dry_run",
        fromStatus: "pending",
        toStatus: "payment_received",
        monimeSessionStatus: sessionStatus,
        reason: "would mark payment_received and attempt transfer",
      };
    }

    await this.markPaymentReceived(donationId, {
      paymentId: session.result.id,
      paymentMethod: { type: "checkout_session", provider: "MONIME" },
      completedAt: new Date().toISOString(),
    });

    const campaignFinancialAccountId = session.result.metadata?.campaignFinancialAccountId;
    if (typeof campaignFinancialAccountId !== "string" || !campaignFinancialAccountId) {
      await this.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Missing campaign financial account ID in checkout session metadata",
        initiatedAt: new Date(),
        retryCount: 0,
      });
      return {
        donationId,
        action: "advanced_to_payment_received",
        fromStatus: "pending",
        toStatus: "payment_received",
        monimeSessionStatus: sessionStatus,
        reason: "transfer not attempted: missing campaign account id in metadata",
      };
    }

    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      await this.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Platform financial account not configured",
        initiatedAt: new Date(),
        retryCount: 0,
      });
      return {
        donationId,
        action: "advanced_to_payment_received",
        fromStatus: "pending",
        toStatus: "payment_received",
        monimeSessionStatus: sessionStatus,
        reason: "transfer not attempted: platform account not configured",
      };
    }

    const fresh = await donationRepository.findById(donationId);
    if (!fresh) throw new Error(`Donation ${donationId} disappeared after markPaymentReceived`);

    try {
      await this.updateTransferStatus(donationId, {
        status: "pending",
        initiatedAt: new Date(),
        retryCount: 0,
      });

      const transfer = await monimeService.createInternalTransfer({
        amount: { currency: fresh.amount.currency, value: fresh.amount.minor },
        sourceFinancialAccount: { id: platformAccount.id },
        destinationFinancialAccount: { id: campaignFinancialAccountId },
        description: `Donation transfer for ${donationId}`,
        metadata: { donationId, type: "donation_transfer", source: "reconciliation" },
      }, `donation_transfer_${donationId}`);

      if (transfer.status === "completed") {
        await this.completeWithTransfer(donationId, transfer.id);
        return {
          donationId,
          action: "advanced_to_succeeded",
          fromStatus: "pending",
          toStatus: "succeeded",
          monimeSessionStatus: sessionStatus,
        };
      }

      await this.updateTransferStatus(donationId, {
        id: transfer.id,
        status: transfer.status === "failed" ? "failed" : "pending",
        failureReason: transfer.status === "failed" ? (transfer.failureReason || "Transfer failed") : undefined,
      });

      return {
        donationId,
        action: "advanced_to_payment_received",
        fromStatus: "pending",
        toStatus: "payment_received",
        monimeSessionStatus: sessionStatus,
        reason: `transfer ${transfer.status}, will be resolved on next reconciliation tick`,
      };
    } catch (transferError) {
      const message = transferError instanceof Error ? transferError.message : "Transfer API error";
      await this.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: message,
        retryCount: 1,
      });
      return {
        donationId,
        action: "advanced_to_payment_received",
        fromStatus: "pending",
        toStatus: "payment_received",
        monimeSessionStatus: sessionStatus,
        reason: `transfer error: ${message}`,
      };
    }
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
    failedAmount: number;
    refundedDonations: number;
    refundedAmount: number;
    paymentReceivedDonations: number;
    paymentReceivedAmount: number;
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
    campaignPayouts: number;
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
