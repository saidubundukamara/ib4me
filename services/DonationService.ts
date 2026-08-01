import mongoose from "mongoose";
import {
  donationRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IDonation, IDonationTransfer, IDonationQuote } from "../models/Donation";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";
import type { DonationFilters, DonationListOptions } from "../repositories/DonationRepository";
import { auditLogService } from "./AuditLogService";
import type { AuditContext } from "../lib/admin-auth";

import { monimeService } from "../lib/monime";
import { settingService } from "./SettingService";
import { computeDonationSplit, type DonationSplit } from "../lib/fees";
import { createUserNotification, createAdminNotification } from "../lib/createNotification";
import CampaignModel from "../models/Campaign";

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

export interface CreateDonationInput {
  campaignId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId | null;
  donorSnapshot?: { name?: string; email?: string } | null;
  isAnonymous?: boolean;
  message?: string | null;
  /** What the donor entered — and, since fees are deducted, what they are charged. */
  amountMinor: number;
  totalChargedMinor?: number;
  /** The quote's estimate; replaced by the authoritative split at settlement. */
  campaignReceivesMinor?: number;
  currency: string;
  provider: { name: string; paymentId?: string; checkoutSessionId?: string };
  /** The estimated split shown to the donor, persisted for the receipt and for R10. */
  quote?: IDonationQuote;
  campaignType?: "individual" | "organization";
  idempotencyKey?: string | null;
}

/**
 * How much of this donation belongs to the campaign — the ONE place that answers it.
 *
 * Read from the persisted settlement split and never recomputed at the call site. The
 * amount we move must equal the amount we booked: it is easy to compute a correct net,
 * write it to the ledger, and then transfer a different variable — typically the gross,
 * because that is the one already in scope. The books then say one thing while the money
 * does another, and the discrepancy stays invisible until the source account runs dry
 * (MONIME-FEE-MODEL.md R14).
 *
 * The fallback chain lets pre-settlement rows and legacy donations read through
 * unchanged: old donations were charged under "fees added on top", so their
 * `campaignReceivesMinor` genuinely equals `amount.minor`.
 */
export function payableToCampaignMinor(donation: IDonation): number {
  return (
    donation.settlement?.campaignReceivesMinor ??
    donation.campaignReceivesMinor ??
    donation.amount.minor
  );
}

export class DonationService {
  async createPending(input: CreateDonationInput): Promise<IDonation> {
    const existing = input.idempotencyKey
      ? await donationRepository.findByIdempotencyKey(input.idempotencyKey)
      : null;
    if (existing) return existing;

    const campaignReceivesMinor = input.campaignReceivesMinor ?? input.amountMinor;

    return donationRepository.create({
      campaignId: input.campaignId,
      donorId: input.donorId ?? null,
      donorSnapshot: input.donorSnapshot ?? null,
      isAnonymous: Boolean(input.isAnonymous),
      message: input.message ?? null,
      amount: { currency: input.currency, minor: input.amountMinor },
      totalChargedMinor: input.totalChargedMinor ?? input.amountMinor,
      // The quote's estimate. Overwritten with the authoritative figure once Monime
      // settles and `applySettlement` computes the real split.
      campaignReceivesMinor,
      quote: input.quote,
      // Kept only so the legacy fee block still records which rate tier applied.
      fees: input.campaignType ? { campaignType: input.campaignType } : undefined,
      provider: input.provider,
      status: "pending",
      idempotencyKey: input.idempotencyKey ?? null,
    } as unknown as Partial<IDonation>);
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
   * Record that Monime settled a payment, and compute the authoritative split.
   *
   * This is the single settlement entry point — the webhook, the success redirect, the
   * status poll and the reconciliation sweep all come through here so they cannot
   * disagree about what a donation is worth.
   *
   * ## `monimeFeeMinor: null` means UNKNOWN, and must never be written as 0
   *
   * Monime fires TWO events for one payment: `checkout_session.completed`, which carries
   * no fees, and `payment.processing_completed`, which does. Either can arrive first.
   * Conflating "I wasn't told the fee" with "the fee was zero" means the fee-less event
   * clobbers the real fee roughly half the time (MONIME-FEE-MODEL.md R6). Hence the four
   * cases below.
   */
  async applySettlement(
    donationId: string,
    input: {
      source:
        | "webhook_payment"
        | "webhook_session"
        | "success_redirect"
        | "status_poll"
        | "reconcile";
      /** Monime's reported collection fee. `null`/omitted = NOT REPORTED, never zero. */
      monimeFeeMinor?: number | null;
      /** Monime's `spm-…` payment id — the per-capture correction key. */
      monimePaymentId?: string | null;
      financialTransactionReference?: string | null;
      channelReference?: string | null;
      paymentMethod?: { type: string; provider?: string };
      completedAt?: string;
    },
    session?: ServiceSession
  ): Promise<IDonation> {
    return runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) throw new Error("Donation not found");

      if (donation.status === "failed" || donation.status === "refunded") {
        throw new Error(`Cannot settle a ${donation.status} donation`);
      }

      const reportedFee =
        typeof input.monimeFeeMinor === "number" ? input.monimeFeeMinor : null;
      const existing = donation.settlement;
      const alreadyApplied = Boolean(existing?.appliedAt);

      // ---- Case B: a second event that tells us nothing new. Write nothing. ----
      // This is the clobber fix. The old code called through here and wrote
      // `paymentFeeMinor: 0`, destroying a fee the other event had already recorded.
      if (alreadyApplied && reportedFee === null) {
        return donation;
      }

      // ---- Case D: replay of a fee we have already recorded. ----
      if (alreadyApplied && existing?.monimeFeeSource === "reported") {
        return donation;
      }

      // ---- Case C: a reported fee arriving after we settled on an estimate. ----
      if (alreadyApplied && reportedFee !== null) {
        return this.applyLateFeeCorrection(donation, reportedFee, input, txn);
      }

      // ---- Case A: first application. ----
      // The platform rate comes from the donation's own quote, not from current settings:
      // an admin changing the fee between the donor paying and Monime settling must not
      // move the goalposts on a donation already in flight (R4/R10).
      const platformFeeBps =
        donation.quote?.platformFeeBps ??
        donation.fees?.processingFeeBps ??
        (await settingService.getPlatformFeeBps(
          donation.fees?.campaignType ?? "individual"
        ));

      const split = computeDonationSplit({
        grossMinor: donation.amount.minor,
        platformFeeBps,
        monimeFeeMinor: reportedFee,
        monimeFeeBpsFallback:
          donation.quote?.monimeFeeBpsEstimate ??
          (await settingService.getMonimeFeeEstimateBps()),
      });

      if (split.monimeFeeSource === "estimated") {
        // Loud and greppable on purpose. A donation settled from a polled read carries no
        // fee data, so we are over-crediting the campaign until a correction arrives
        // (MONIME-FEE-MODEL.md §14.2).
        console.warn(
          `[settlement] donation ${donationId} settled with an ESTIMATED Monime fee ` +
            `(source=${input.source}). Campaign credited ${split.campaignReceivesMinor}, ` +
            `which will be wrong if Monime's actual fee differs from ${split.monimeFeeMinor}.`
        );
      }

      const settlement = {
        grossMinor: split.grossMinor,
        monimeFeeMinor: split.monimeFeeMinor,
        monimeFeeSource: split.monimeFeeSource,
        arrivedMinor: split.arrivedMinor,
        platformFeeBps: split.platformFeeBps,
        platformFeeMinor: split.platformFeeMinor,
        campaignReceivesMinor: split.campaignReceivesMinor,
        monimePaymentId: input.monimePaymentId ?? undefined,
        financialTransactionReference: input.financialTransactionReference ?? undefined,
        channelReference: input.channelReference ?? undefined,
        appliedAt: new Date(),
        frozen: false,
      };

      const set: Record<string, unknown> = {
        settlement,
        campaignReceivesMinor: split.campaignReceivesMinor,
        updatedAt: new Date(),
      };
      if (donation.status === "pending") set.status = "payment_received";
      // Only the `spm-…` payment id belongs here. Three call sites used to write the
      // CHECKOUT SESSION id into this field, which made the per-capture correction key
      // useless.
      if (input.monimePaymentId) set["provider.paymentId"] = input.monimePaymentId;
      if (input.completedAt) set.completedAt = new Date(input.completedAt);

      const updated = await donationRepository.updateById(
        donationId,
        { $set: set } as never,
        txn
      );
      if (!updated) throw new Error("Failed to apply settlement");

      // The campaign is credited the NET — what actually reaches its account.
      await campaignRepository.updateById(
        donation.campaignId.toString(),
        {
          $inc: {
            "totals.raisedMinor": split.campaignReceivesMinor,
            "totals.donationCount": 1,
          } as never,
          $set: { "totals.lastDonationAt": new Date() } as never,
        } as never,
        txn
      );

      await this.postSettlementLedger(donation, split, txn);

      return updated;
    }, session);
  }

  /**
   * Ledger entries 1-3: the money arriving and being split, before any transfer.
   *
   * Booking the gross in and the processor fee out (rather than just booking the net)
   * keeps Monime's cost queryable from the ledger instead of derivable only from an
   * assumed rate — which is what R13 is about. The arithmetic is identical either way:
   * receipt − processorFee − transferOut leaves exactly the platform fee, which is
   * precisely what physically remains in the platform account.
   */
  private async postSettlementLedger(
    donation: IDonation,
    split: DonationSplit,
    txn: ServiceSession
  ): Promise<void> {
    const id = String(donation._id);
    const currency = donation.amount.currency;

    await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform",
        refType: "platform_receipt",
        refId: donation._id as mongoose.Types.ObjectId,
        direction: "in",
        amountMinor: split.grossMinor,
        currency,
        monimeRef: donation.settlement?.monimePaymentId ?? null,
        description: `Payment collected for donation ${id}`,
      },
      `donation-receipt:${id}`,
      txn
    );

    await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform",
        refType: "processor_fee",
        refId: donation._id as mongoose.Types.ObjectId,
        direction: "out",
        amountMinor: split.monimeFeeMinor,
        currency,
        description: `Monime collection fee for donation ${id}`,
      },
      `donation-processor-fee:${id}`,
      txn
    );

    await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform_revenue",
        campaignId: donation.campaignId,
        refType: "platform_fee",
        refId: donation._id as mongoose.Types.ObjectId,
        direction: "in",
        amountMinor: split.platformFeeMinor,
        currency,
        description: `Platform fee for donation ${id}`,
      },
      `donation-platform-fee:${id}`,
      txn
    );
  }

  /**
   * A reported fee arrived after we had already settled on an estimate (R6).
   *
   * Which way we correct depends on whether the money has physically moved yet.
   */
  private async applyLateFeeCorrection(
    donation: IDonation,
    reportedFee: number,
    input: { monimePaymentId?: string | null; source: string },
    txn: ServiceSession
  ): Promise<IDonation> {
    const id = String(donation._id);
    const prev = donation.settlement!;
    // Key PER CAPTURE, not per donation: a payment settled in more than one capture is
    // charged a separately-rounded fee each time, and a donation-scoped key would swallow
    // every correction after the first.
    const captureRef = input.monimePaymentId ?? prev.monimePaymentId ?? "unknown";

    const corrected = computeDonationSplit({
      grossMinor: donation.amount.minor,
      platformFeeBps: prev.platformFeeBps,
      monimeFeeMinor: reportedFee,
    });

    const feeDelta = corrected.monimeFeeMinor - prev.monimeFeeMinor;
    if (feeDelta === 0) {
      // Same number we already assumed — just record that it is now confirmed.
      const updated = await donationRepository.updateById(
        id,
        {
          $set: {
            "settlement.monimeFeeSource": "reported",
            "settlement.monimePaymentId": captureRef,
            "settlement.correctedAt": new Date(),
          },
        } as never,
        txn
      );
      return updated ?? donation;
    }

    if (prev.frozen) {
      // The money has already moved at the old numbers. Rewriting the split now would
      // make the books disagree with the transfer that actually happened (R14), so the
      // campaign's figure stands and the difference is booked as a platform variance.
      console.warn(
        `[settlement] donation ${id}: Monime reported a fee of ${reportedFee} after the ` +
          `transfer had completed at an assumed ${prev.monimeFeeMinor}. ` +
          `Booking a ${feeDelta} variance against the platform account.`
      );

      await ledgerEntryRepository.createIdempotent(
        {
          accountType: "platform",
          refType: "platform_fee_variance",
          campaignId: donation.campaignId,
          refId: donation._id as mongoose.Types.ObjectId,
          direction: feeDelta > 0 ? "out" : "in",
          amountMinor: Math.abs(feeDelta),
          currency: donation.amount.currency,
          monimeRef: captureRef,
          description: `Late Monime fee correction for donation ${id}`,
        },
        `donation-fee-variance:${id}:${captureRef}`,
        txn
      );

      const updated = await donationRepository.updateById(
        id,
        {
          $set: {
            "settlement.monimeFeeMinor": corrected.monimeFeeMinor,
            "settlement.monimeFeeSource": "reported",
            "settlement.monimePaymentId": captureRef,
            "settlement.correctedAt": new Date(),
          },
        } as never,
        txn
      );
      return updated ?? donation;
    }

    // Nothing has moved yet, so correct the split properly and let the transfer read it.
    const moved = await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform",
        refType: "processor_fee",
        refId: donation._id as mongoose.Types.ObjectId,
        direction: feeDelta > 0 ? "out" : "in",
        amountMinor: Math.abs(feeDelta),
        currency: donation.amount.currency,
        monimeRef: captureRef,
        description: `Monime fee correction for donation ${id}`,
      },
      `donation-fee-correction-proc:${id}:${captureRef}`,
      txn
    );

    // Mirror onto the donation ONLY if the ledger actually moved. Incrementing
    // unconditionally lets a replayed webhook claim the same correction twice (R6).
    if (!moved) return donation;

    const platformDelta = corrected.platformFeeMinor - prev.platformFeeMinor;
    await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform_revenue",
        campaignId: donation.campaignId,
        refType: "platform_fee",
        refId: donation._id as mongoose.Types.ObjectId,
        direction: platformDelta > 0 ? "in" : "out",
        amountMinor: Math.abs(platformDelta),
        currency: donation.amount.currency,
        monimeRef: captureRef,
        description: `Platform fee correction for donation ${id}`,
      },
      `donation-fee-correction-fee:${id}:${captureRef}`,
      txn
    );

    const receivesDelta =
      corrected.campaignReceivesMinor - prev.campaignReceivesMinor;
    if (receivesDelta !== 0) {
      await campaignRepository.updateById(
        donation.campaignId.toString(),
        { $inc: { "totals.raisedMinor": receivesDelta } as never } as never,
        txn
      );
    }

    const updated = await donationRepository.updateById(
      id,
      {
        $set: {
          "settlement.monimeFeeMinor": corrected.monimeFeeMinor,
          "settlement.monimeFeeSource": "reported",
          "settlement.arrivedMinor": corrected.arrivedMinor,
          "settlement.platformFeeMinor": corrected.platformFeeMinor,
          "settlement.campaignReceivesMinor": corrected.campaignReceivesMinor,
          "settlement.monimePaymentId": captureRef,
          "settlement.correctedAt": new Date(),
          campaignReceivesMinor: corrected.campaignReceivesMinor,
        },
      } as never,
      txn
    );
    return updated ?? donation;
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
   * Complete a donation once the internal transfer to the campaign has landed.
   *
   * Posts the two transfer legs and FREEZES the settlement split: after this point the
   * money has physically moved at these numbers, so a late fee correction may no longer
   * rewrite them (R14) — it books a variance instead. See `applyLateFeeCorrection`.
   *
   * Campaign totals are NOT incremented here. `applySettlement` is the single place that
   * credits `raisedMinor`; this used to carry a second increment for the case where
   * settlement had been skipped, which was a double-count waiting to happen.
   */
  async completeWithTransfer(
    donationId: string,
    transferId: string,
    session?: ServiceSession
  ): Promise<IDonation> {
    const completed = await runInTransaction<IDonation>(async (txn) => {
      const donation = await donationRepository.findById(donationId);
      if (!donation) throw new Error("Donation not found");

      if (donation.status === "succeeded") return donation;
      if (donation.status !== "payment_received" && donation.status !== "pending") {
        throw new Error(`Cannot complete donation from status: ${donation.status}`);
      }

      // A donation reaching here without a settlement means the transfer completed before
      // Monime told us anything about the payment. Settle it now (on an estimate) so the
      // campaign is credited exactly once and the ledger has a split to post against.
      if (!donation.settlement?.appliedAt) {
        await this.applySettlement(
          donationId,
          { source: "reconcile", monimeFeeMinor: null },
          txn
        );
      }

      const fresh = (await donationRepository.findById(donationId)) ?? donation;
      const campaignReceivesAmount = payableToCampaignMinor(fresh);

      const updated = await donationRepository.updateById(
        donationId,
        {
          $set: {
            status: "succeeded",
            transfer: {
              id: transferId,
              status: "completed" as const,
              initiatedAt: fresh.transfer?.initiatedAt || new Date(),
              completedAt: new Date(),
              retryCount: fresh.transfer?.retryCount || 0
            },
            "settlement.frozen": true,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        } as never,
        txn
      );
      if (!updated) throw new Error("Failed to complete donation");

      // Ledger legs 4 and 5: the money leaving the platform account and arriving in the
      // campaign's. Both are the SAME figure, and the same one that was transferred.
      await ledgerEntryRepository.createIdempotent(
        {
          accountType: "platform",
          campaignId: donation.campaignId,
          refType: "platform_transfer_out",
          refId: donation._id as mongoose.Types.ObjectId,
          direction: "out",
          amountMinor: campaignReceivesAmount,
          currency: donation.amount.currency,
          transferId,
          description: `Transfer to campaign for donation ${donationId}`,
        },
        `donation-transfer-out:${donationId}`,
        txn
      );

      await ledgerEntryRepository.createIdempotent(
        {
          accountType: "campaign",
          campaignId: donation.campaignId,
          refType: "campaign_transfer_in",
          refId: donation._id as mongoose.Types.ObjectId,
          direction: "in",
          amountMinor: campaignReceivesAmount,
          currency: donation.amount.currency,
          transferId,
          description: `Donation received from transfer ${transferId}`,
        },
        `donation-transfer-in:${donationId}`,
        txn
      );

      return updated;
    }, session);

    // Fire in-app notifications after the transaction commits (non-blocking).
    try {
      const campaign = await CampaignModel.findById(completed.campaignId)
        .select("ownerId title")
        .lean<{ ownerId: unknown; title?: string }>();
      if (campaign?.ownerId) {
        const amountSLE = (completed.amount.minor / 100).toFixed(2);
        const donorName = completed.isAnonymous
          ? "An anonymous donor"
          : (completed.donorSnapshot?.name ?? "A donor");
        await createUserNotification({
          recipientId: campaign.ownerId as mongoose.Types.ObjectId,
          type: "donation",
          title: "New donation received!",
          message: `${donorName} donated SLE ${amountSLE} to your campaign.`,
          link: `/dashboard/campaigns/${String(completed.campaignId)}`,
        });
        await createAdminNotification({
          type: "donation",
          title: "New donation",
          message: `${donorName} donated SLE ${amountSLE} to "${campaign.title ?? "a campaign"}".`,
          link: `/s/admin/donations`,
        });
      }
    } catch (notifErr) {
      console.error("[DonationService.completeWithTransfer] notification failed:", notifErr);
    }

    return completed;
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
    // R14: the persisted split, never the gross and never a recomputed figure.
    const transferAmount = payableToCampaignMinor(donation);

    // A donation can legitimately have nothing left to move — a tiny amount whose fees
    // consume it entirely. Zero-value movements are illegal (R5), so settle the donation
    // and stop rather than asking Monime to transfer nothing forever.
    if (transferAmount <= 0) {
      await this.completeWithTransfer(donationId, donation.transfer?.id ?? "zero:fees-consumed");
      return { status: "completed", transferId: donation.transfer?.id };
    }

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

    // Reconciliation reads the session, which carries no fee data (§2.10) — settle on
    // an estimate and let the payment webhook correct it.
    await this.applySettlement(donationId, {
      source: "reconcile",
      monimeFeeMinor: null,
      paymentMethod: { type: "checkout_session", provider: "MONIME" },
      completedAt: new Date().toISOString(),
    });

    // Delegate to settleTransfer — the single transfer implementation.
    //
    // This used to be a second copy of it, and the copy had drifted twice: it resolved
    // the destination account from checkout-session metadata rather than from the
    // campaign record (authoritative), and it moved `fresh.amount.minor` — the gross —
    // rather than the persisted split. Both divergences go away with the duplicate.
    const outcome = await this.settleTransfer(donationId, { source: "reconciliation" });

    if (outcome.status === "completed") {
      return {
        donationId,
        action: "advanced_to_succeeded",
        fromStatus: "pending",
        toStatus: "succeeded",
        monimeSessionStatus: sessionStatus,
      };
    }

    return {
      donationId,
      action: "advanced_to_payment_received",
      fromStatus: "pending",
      toStatus: "payment_received",
      monimeSessionStatus: sessionStatus,
      reason:
        outcome.status === "failed"
          ? `transfer failed: ${outcome.reason ?? "unknown"}`
          : "transfer pending, will be resolved on next reconciliation tick",
    };
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
        previouslyFlagged: (donation as unknown as Record<string, unknown>).isFlagged ?? false,
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
        previouslyFlagged: (donation as unknown as Record<string, unknown>).isFlagged ?? false,
        previousFlagReason: (donation as unknown as Record<string, unknown>).flagReason,
        previousFlaggedBy: (donation as unknown as Record<string, unknown>).flaggedBy != null
          ? String((donation as unknown as Record<string, unknown>).flaggedBy)
          : undefined,
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

  /**
   * Mark a donation refunded and reverse its accounting.
   *
   * NAMED "off platform" deliberately: **no money moves here.** Sending the donor their
   * money back is still a manual operation — this method only makes the books agree with
   * a refund that happened (or is about to happen) elsewhere. The original
   * `refundDonation` name read as though it issued a provider refund, which it never did.
   *
   * The reversal is pro-rata against the RECORDED split, never recomputed from a rate
   * (MONIME-FEE-MODEL.md R11): a full refund then reverses exactly what was posted. The
   * old code decremented `raisedMinor` by the GROSS while the campaign had only ever been
   * credited the NET, so every refund quietly pushed the campaign's total below zero by
   * the fee amount.
   *
   * ## The unowned ~2%
   *
   * The donor is owed `grossMinor`, but only `arrivedMinor` ever reached us — Monime kept
   * its cut on the way in and will keep another on the way out, since a refund is sent as
   * a fresh payout. So roughly 2% of a refunded donation has no assigned owner. Whose
   * balance absorbs it is a policy decision, not an accounting one, and it is deliberately
   * NOT decided here (§14.1). What this method does guarantee is that the campaign is
   * debited exactly what it was credited.
   */
  async markRefundedOffPlatform(
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

      // Reverse exactly what was posted — never a rate.
      const campaignReceivesMinor = payableToCampaignMinor(donation);
      const platformFeeMinor = donation.settlement?.platformFeeMinor ?? 0;

      // Refuse to drive the campaign's balance negative. If the owner has already
      // withdrawn the money, correcting here would claim funds that are genuinely gone —
      // that needs an operator, not a silent negative balance.
      const ledger = await ledgerEntryRepository.getCampaignBalance(donation.campaignId);
      if (ledger.balance < campaignReceivesMinor) {
        await auditLogService.record({
          actor: { userId: refundedBy, role: "admin" },
          action: "refund.clawback_required",
          target: { type: "donation", id: new mongoose.Types.ObjectId(donationId) },
          diff: {
            donationId,
            campaignId: donation.campaignId?.toString(),
            campaignBalanceMinor: ledger.balance,
            requiredMinor: campaignReceivesMinor,
            reason: "Campaign balance cannot cover the refund; funds already withdrawn.",
          },
          ip: auditContext?.ip,
          userAgent: auditContext?.userAgent,
        });
        throw new Error(
          "This campaign's balance can no longer cover the refund — the funds have " +
            "already been withdrawn. This needs manual recovery."
        );
      }

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

      // Decrement by what was CREDITED (the net), not the gross.
      await campaignRepository.updateById(
        donation.campaignId.toString(),
        {
          $inc: {
            "totals.raisedMinor": -campaignReceivesMinor,
            "totals.donationCount": -1,
          } as never,
        } as never,
        txn
      );

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
          grossMinor: donation.amount?.minor,
          campaignDebitedMinor: campaignReceivesMinor,
          platformFeeReversedMinor: platformFeeMinor,
          currency: donation.amount?.currency,
          originalDonationDate: donation.createdAt?.toISOString(),
          refundedAt: new Date().toISOString()
        },
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent
      });

      // Take the money back out of the campaign's account…
      await ledgerEntryRepository.createIdempotent(
        {
          campaignId: donation.campaignId,
          accountType: "campaign",
          refType: "donation_refund",
          refId: donation._id as mongoose.Types.ObjectId,
          direction: "out",
          amountMinor: campaignReceivesMinor,
          currency: donation.amount.currency,
          description: `Refund for donation ${donationId}: ${refundReason}`,
        },
        `donation-refund:${donationId}`,
        txn
      );

      // …and give back the fee we charged on it. Omitted when it floored to zero (R5).
      await ledgerEntryRepository.createIdempotent(
        {
          campaignId: donation.campaignId,
          accountType: "platform_revenue",
          refType: "donation_refund",
          refId: donation._id as mongoose.Types.ObjectId,
          direction: "out",
          amountMinor: platformFeeMinor,
          currency: donation.amount.currency,
          description: `Platform fee reversal for donation ${donationId}`,
        },
        `donation-refund-fee:${donationId}`,
        txn
      );

      return updated;
    }, session);
  }
}

export const donationService = new DonationService();
