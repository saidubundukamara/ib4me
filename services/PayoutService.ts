import mongoose from "mongoose";
import {
  payoutRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IPayout } from "../models/Payout";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";

export interface RequestPayoutInput {
  campaignId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  amountMinor: number;
  method: IPayout["method"];
}

export class PayoutService {
  async requestPayout(input: RequestPayoutInput): Promise<IPayout> {
    if (input.amountMinor <= 0)
      throw new Error("Payout amount must be positive");
    return payoutRepository.create({
      campaignId: input.campaignId,
      requestedBy: input.requestedBy,
      amountMinor: input.amountMinor,
      method: input.method,
      status: "in_review",
    } as unknown as Partial<IPayout>);
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
}

export const payoutService = new PayoutService();
