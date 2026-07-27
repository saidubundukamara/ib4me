import mongoose from "mongoose";
import { tipRepository, settingRepository, ledgerEntryRepository } from "../repositories";
import { ITip } from "../models/Tip";
import type { TipFilters, TipListOptions } from "../repositories/TipRepository";
import { computeTipSplit } from "../lib/fees";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";
import { settingService } from "./SettingService";

export interface CreateTipInput {
  tipperId?: mongoose.Types.ObjectId | null;
  tipperSnapshot?: { name?: string; email?: string; phone?: string } | null;
  isAnonymous?: boolean;
  message?: string | null;
  amountMinor: number;
  currency: string;
  provider: { name: string; paymentId?: string; checkoutSessionId?: string };
  source?: "tip_page" | "donation_success";
  idempotencyKey?: string | null;
}

export class TipService {
  async createPending(input: CreateTipInput): Promise<ITip> {
    // Check idempotency
    const existing = input.idempotencyKey
      ? await tipRepository.findByIdempotencyKey(input.idempotencyKey)
      : null;
    if (existing) return existing;

    return tipRepository.create({
      tipperId: input.tipperId ?? null,
      tipperSnapshot: input.tipperSnapshot ?? null,
      isAnonymous: Boolean(input.isAnonymous),
      message: input.message ?? null,
      amount: { currency: input.currency, minor: input.amountMinor },
      provider: input.provider,
      status: "pending",
      source: input.source ?? "tip_page",
      idempotencyKey: input.idempotencyKey ?? null,
    } as unknown as Partial<ITip>);
  }

  async getById(tipId: string): Promise<ITip | null> {
    return tipRepository.findById(tipId);
  }

  async updateCheckoutSession(
    tipId: string,
    checkoutSessionId: string
  ): Promise<ITip> {
    const updated = await tipRepository.updateById(tipId, {
      $set: { "provider.checkoutSessionId": checkoutSessionId },
    } as never);
    if (!updated)
      throw new Error("Failed to update tip with checkout session ID");
    return updated;
  }

  /**
   * Record that Monime settled a tip, and book it.
   *
   * Replaces `markSucceeded` and `markSucceededWithPaymentDetails`, which between them had
   * the same defect the donation path was just fixed for — and it was live:
   *
   *   - `markSucceeded` (the `checkout_session.completed` branch) wrote
   *     `netAmountMinor = amount.minor`, the GROSS, and recorded no fee at all.
   *   - `markSucceededWithPaymentDetails` (the `payment.processing_completed` branch, the
   *     only one carrying `fees[]`) returned early if the tip was already `succeeded`.
   *
   * So whenever the fee-less event arrived first — which it does about half the time — the
   * real fee was discarded and the tip stayed booked roughly 1% over, permanently
   * (MONIME-FEE-MODEL.md R1/R6).
   *
   * `monimeFeeMinor: null` means NOT REPORTED and must never be written as `0`. The four
   * cases below are the same ones `DonationService.applySettlement` handles.
   *
   * Simpler than a donation in one respect: nothing ever leaves the tip account, so there
   * is no transfer to freeze and a late correction is always cleanly postable (no R14 case).
   */
  async applySettlement(
    tipId: string,
    input: {
      source: "webhook_session" | "webhook_payment" | "manual";
      /** Monime's reported fee. `null`/omitted = NOT REPORTED, never zero. */
      monimeFeeMinor?: number | null;
      monimePaymentId?: string | null;
      financialTransactionReference?: string | null;
      channelReference?: string | null;
      completedAt?: string;
    },
    session?: ServiceSession
  ): Promise<ITip> {
    return runInTransaction<ITip>(async (txn) => {
      const tip = await tipRepository.findById(tipId);
      if (!tip) throw new Error("Tip not found");
      if (tip.status === "failed" || tip.status === "refunded") {
        throw new Error(`Cannot settle a ${tip.status} tip`);
      }

      const reportedFee =
        typeof input.monimeFeeMinor === "number" ? input.monimeFeeMinor : null;
      const existing = tip.settlement;
      const alreadyApplied = Boolean(existing?.appliedAt);

      // Case B — a second event telling us nothing new. Write nothing. This is the fix.
      if (alreadyApplied && reportedFee === null) return tip;

      // Case D — replay of a fee we already recorded.
      if (alreadyApplied && existing?.monimeFeeSource === "reported") return tip;

      // Case C — a reported fee arriving after we settled on an estimate.
      if (alreadyApplied && reportedFee !== null) {
        return this.applyLateTipFeeCorrection(tip, reportedFee, input, txn);
      }

      // Case A — first application.
      const split = computeTipSplit({
        grossMinor: tip.amount.minor,
        monimeFeeMinor: reportedFee,
        monimeFeeBpsFallback: await settingService.getMonimeFeeEstimateBps(),
      });

      if (split.feeSource === "estimated") {
        console.warn(
          `[tip-settlement] tip ${tipId} settled with an ESTIMATED Monime fee ` +
            `(source=${input.source}). The tip account is over-booked by the difference ` +
            `until the payment event reports the real figure.`
        );
      }

      const settlement = {
        grossMinor: split.grossMinor,
        monimeFeeMinor: split.monimeFeeMinor,
        monimeFeeSource: split.feeSource,
        netMinor: split.netMinor,
        monimePaymentId: input.monimePaymentId ?? undefined,
        financialTransactionReference: input.financialTransactionReference ?? undefined,
        channelReference: input.channelReference ?? undefined,
        appliedAt: new Date(),
      };

      const updated = await tipRepository.updateById(
        tipId,
        {
          $set: {
            status: "succeeded",
            settlement,
            // Mirrors, for the admin views that already read these.
            "fees.paymentFeeMinor": split.monimeFeeMinor,
            netAmountMinor: split.netMinor,
            ...(input.monimePaymentId
              ? { "provider.paymentId": input.monimePaymentId }
              : {}),
            completedAt: input.completedAt ? new Date(input.completedAt) : new Date(),
            updatedAt: new Date(),
          },
        } as never,
        txn
      );
      if (!updated) throw new Error("Failed to apply tip settlement");

      await this.postTipLedger(tip, split, txn);

      return updated;
    }, session);
  }

  /**
   * Ledger legs for a settled tip.
   *
   * `platform_tips` is its own account type on purpose — it is a different physical Monime
   * account from `platform`, and folding the two together would inflate the platform
   * ledger by every tip ever taken.
   *
   * Identity: `tip_receipt − processor_fee == netMinor ==` the live Monime balance of
   * `tipFinancialAccount`, at zero tolerance. There is no transfer-out leg because nothing
   * ever leaves the tip account.
   */
  private async postTipLedger(
    tip: ITip,
    split: { grossMinor: number; monimeFeeMinor: number },
    txn: ServiceSession
  ): Promise<void> {
    const id = String(tip._id);

    await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform_tips",
        refType: "tip_receipt",
        refId: tip._id as mongoose.Types.ObjectId,
        direction: "in",
        amountMinor: split.grossMinor,
        currency: tip.amount.currency,
        monimeRef: tip.settlement?.monimePaymentId ?? null,
        description: `Platform tip ${id}`,
      },
      `tip-receipt:${id}`,
      txn
    );

    // Omitted entirely when Monime charged nothing — zero-amount lines are illegal (R5),
    // and `createIdempotent` already refuses them.
    await ledgerEntryRepository.createIdempotent(
      {
        accountType: "platform_tips",
        refType: "processor_fee",
        refId: tip._id as mongoose.Types.ObjectId,
        direction: "out",
        amountMinor: split.monimeFeeMinor,
        currency: tip.amount.currency,
        description: `Monime collection fee for tip ${id}`,
      },
      `tip-processor-fee:${id}`,
      txn
    );
  }

  /**
   * A reported fee arrived after the tip was settled on an estimate (R6).
   *
   * Keyed PER CAPTURE, not per tip: a tip-scoped key would swallow every correction after
   * the first. Unlike a donation there is no frozen case — nothing has physically left the
   * tip account, so the split can always be corrected properly.
   */
  private async applyLateTipFeeCorrection(
    tip: ITip,
    reportedFee: number,
    input: { monimePaymentId?: string | null },
    txn: ServiceSession
  ): Promise<ITip> {
    const id = String(tip._id);
    const prev = tip.settlement!;
    const captureRef = input.monimePaymentId ?? prev.monimePaymentId ?? "unknown";

    const corrected = computeTipSplit({
      grossMinor: tip.amount.minor,
      monimeFeeMinor: reportedFee,
    });

    const delta = corrected.monimeFeeMinor - prev.monimeFeeMinor;

    if (delta !== 0) {
      const moved = await ledgerEntryRepository.createIdempotent(
        {
          accountType: "platform_tips",
          refType: "processor_fee",
          refId: tip._id as mongoose.Types.ObjectId,
          // A larger real fee means more left the account than we booked.
          direction: delta > 0 ? "out" : "in",
          amountMinor: Math.abs(delta),
          currency: tip.amount.currency,
          monimeRef: captureRef,
          description: `Monime fee correction for tip ${id}`,
        },
        `tip-fee-correction:${id}:${captureRef}`,
        txn
      );

      // Mirror onto the tip ONLY if the ledger actually moved — otherwise a replayed
      // webhook lets the tip claim the same correction twice (R6).
      if (!moved) return tip;
    }

    const updated = await tipRepository.updateById(
      id,
      {
        $set: {
          "settlement.monimeFeeMinor": corrected.monimeFeeMinor,
          "settlement.monimeFeeSource": "reported",
          "settlement.netMinor": corrected.netMinor,
          "settlement.monimePaymentId": captureRef,
          "settlement.correctedAt": new Date(),
          "fees.paymentFeeMinor": corrected.monimeFeeMinor,
          netAmountMinor: corrected.netMinor,
        },
      } as never,
      txn
    );
    return updated ?? tip;
  }

  async markFailed(tipId: string, failureReason?: string): Promise<ITip> {
    const tip = await tipRepository.findById(tipId);
    if (!tip) throw new Error("Tip not found");

    if (tip.status === "succeeded") {
      throw new Error("Cannot mark succeeded tip as failed");
    }

    const updated = await tipRepository.updateById(tipId, {
      $set: {
        status: "failed",
        failureReason: failureReason || "Payment failed",
        updatedAt: new Date(),
      },
    } as never);

    if (!updated) throw new Error("Failed to update tip status");
    return updated;
  }

  /**
   * The Monime account tips are collected into.
   *
   * Deliberately NOT `platformFinancialAccount` — that one receives donation payments and
   * platform fees. Tips are a separate pot with a separate balance, which is why a tip
   * cannot be bundled into a donation's checkout: one charge cannot land in two accounts.
   *
   * (Previously named `getPlatformFinancialAccount`, which said the opposite of what it
   * does and had to be read to be believed.)
   */
  async getTipFinancialAccount(): Promise<{
    id: string;
    uvan: string;
  } | null> {
    const settings = await settingRepository.getPlatformSettings();
    if (
      !settings?.tipFinancialAccount?.id ||
      !settings?.tipFinancialAccount?.uvan
    ) {
      return null;
    }
    return {
      id: settings.tipFinancialAccount.id,
      uvan: settings.tipFinancialAccount.uvan,
    };
  }

  /**
   * Whether a donor should be offered the chance to tip, and on what terms.
   *
   * The single gate. Tipping is only live when it is BOTH switched on and pointed at a
   * configured account — an admin can flip the toggle without ever setting the account,
   * and in that state nothing may be offered, because there is nowhere for the money to
   * go. Every public surface (the /tip page, the thank-you CTA, the nav and footer links)
   * asks this one question rather than re-deriving it, so they cannot disagree about
   * whether tipping is available.
   */
  async getPublicTippingState(): Promise<{
    enabled: boolean;
    suggestedAmounts: number[];
    minAmountMinor: number;
    maxAmountMinor: number;
  }> {
    const [tipping, account] = await Promise.all([
      settingService.getTippingSettings(),
      this.getTipFinancialAccount(),
    ]);

    const isConfigured = Boolean(account?.id && account?.uvan);

    return {
      enabled: isConfigured && (tipping?.enabled ?? false),
      suggestedAmounts: tipping?.suggestedAmounts ?? [5000, 10000, 25000, 50000],
      minAmountMinor: tipping?.minAmountMinor ?? 100,
      maxAmountMinor: tipping?.maxAmountMinor ?? 10000000,
    };
  }

  // Admin methods
  async listForAdmin(
    filters: TipFilters = {},
    options: TipListOptions = {}
  ): Promise<{
    tips: ITip[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return tipRepository.listForAdmin(filters, options);
  }

  async getAnalytics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalTips: number;
    totalAmountMinor: number;
    successfulTips: number;
    successfulAmountMinor: number;
    pendingTips: number;
    pendingAmountMinor: number;
    failedTips: number;
    averageTipMinor: number;
    successRate: number;
  }> {
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    const result = await tipRepository.getAnalytics(dateFromObj, dateToObj);

    // Get pending and failed counts
    const pendingResult = await tipRepository.listForAdmin(
      { status: "pending", dateFrom: dateFromObj, dateTo: dateToObj },
      { page: 1, limit: 1 }
    );
    const failedResult = await tipRepository.listForAdmin(
      { status: "failed", dateFrom: dateFromObj, dateTo: dateToObj },
      { page: 1, limit: 1 }
    );

    return {
      totalTips: result.totalTips,
      totalAmountMinor: result.totalAmount,
      successfulTips: result.successfulTips,
      successfulAmountMinor: result.successfulAmount,
      pendingTips: pendingResult.total,
      pendingAmountMinor: 0, // Would need aggregation for this
      failedTips: failedResult.total,
      averageTipMinor: result.averageTip,
      successRate: result.successRate,
    };
  }

  async getTopTippers(
    limit: number = 10
  ): Promise<
    Array<{
      name: string;
      email?: string;
      totalAmountMinor: number;
      tipCount: number;
      lastTipDate: string;
      isAnonymous: boolean;
    }>
  > {
    const result = await tipRepository.getTopTippers(limit);
    return result.map((tipper) => ({
      name: tipper.tipperName,
      email: tipper.tipperEmail,
      totalAmountMinor: tipper.totalAmount,
      tipCount: tipper.tipCount,
      lastTipDate: tipper.lastTip.toISOString(),
      isAnonymous: tipper.isAnonymous,
    }));
  }
}

export const tipService = new TipService();
