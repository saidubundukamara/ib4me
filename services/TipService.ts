import mongoose from "mongoose";
import { tipRepository, settingRepository } from "../repositories";
import { ITip } from "../models/Tip";
import type { TipFilters, TipListOptions } from "../repositories/TipRepository";

export interface CreateTipInput {
  tipperId?: mongoose.Types.ObjectId | null;
  tipperSnapshot?: { name?: string; email?: string; phone?: string } | null;
  isAnonymous?: boolean;
  message?: string | null;
  amountMinor: number;
  currency: string;
  provider: { name: string; paymentId?: string; checkoutSessionId?: string };
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

  async markSucceeded(tipId: string): Promise<ITip> {
    const tip = await tipRepository.findById(tipId);
    if (!tip) throw new Error("Tip not found");
    if (tip.status === "succeeded") return tip;
    if (tip.status === "failed" || tip.status === "refunded") {
      throw new Error("Cannot mark tip as succeeded from current status");
    }

    const updated = await tipRepository.updateById(tipId, {
      $set: {
        status: "succeeded",
        netAmountMinor: tip.amount.minor,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    } as never);

    if (!updated) throw new Error("Failed to update tip status");
    return updated;
  }

  async markSucceededWithPaymentDetails(
    tipId: string,
    paymentDetails: {
      paymentId: string;
      paymentMethod: { type: string; provider?: string };
      fees?: { total: number; breakdown: Record<string, number> };
      completedAt?: string;
    }
  ): Promise<ITip> {
    const tip = await tipRepository.findById(tipId);
    if (!tip) throw new Error("Tip not found");
    if (tip.status === "succeeded") return tip;
    if (tip.status === "failed" || tip.status === "refunded") {
      throw new Error("Cannot mark tip as succeeded from current status");
    }

    const fees = paymentDetails.fees
      ? {
          paymentFeeMinor: Math.round(paymentDetails.fees.total),
        }
      : undefined;

    const netAmountMinor = tip.amount.minor - (fees?.paymentFeeMinor || 0);

    const updated = await tipRepository.updateById(tipId, {
      $set: {
        status: "succeeded",
        "provider.paymentId": paymentDetails.paymentId,
        fees,
        netAmountMinor,
        completedAt: paymentDetails.completedAt
          ? new Date(paymentDetails.completedAt)
          : new Date(),
        updatedAt: new Date(),
      },
    } as never);

    if (!updated) throw new Error("Failed to update tip status");
    return updated;
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

  async getPlatformFinancialAccount(): Promise<{
    id: string;
    uvan: string;
  } | null> {
    const settings = await settingRepository.getPlatformSettings();
    // Tips go to tipFinancialAccount (separate from platformFinancialAccount which receives fees)
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
