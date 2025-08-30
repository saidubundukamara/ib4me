import mongoose from "mongoose";
import {
  payoutRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IPayout } from "../models/Payout";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";
import { monimeService, MonimePayoutRequest } from "../lib/monime";
import { randomUUID } from "crypto";

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

      // Create payout record first
      const payout = await payoutRepository.create(
        {
          campaignId: input.campaignId,
          requestedBy: input.requestedBy,
          amountMinor: input.amountMinor,
          method: input.method,
          status: "processing",
        } as unknown as Partial<IPayout>,
        txn
      );

      try {
        // Helper function to determine mobile money provider based on phone number
        const getMobileMoneyProvider = (phoneNumber: string): string => {
          // Remove any leading zeros or country codes
          const cleanNumber = phoneNumber.replace(/^(\+232|232|0)/, "");

          // Orange Money (Airtel) - starts with 76, 77, 78
          if (/^7[678]/.test(cleanNumber)) {
            return "m17"; // Orange Money provider ID
          }

          // Africell (AfriMoney) - starts with 79, 30, 31, 32, 33, 34
          if (/^(79|3[0-4])/.test(cleanNumber)) {
            return "m18"; // AfriMoney provider ID
          }

          // Default to Orange Money if can't determine
          return "m17";
        };

        // Prepare Monime payout request
        let destination: MonimePayoutRequest["destination"];

        if (input.method.type === "mobile_money") {
          const phoneNumber =
            (input.method as { type: "mobile_money"; msisdn?: string })
              .msisdn || "";
          destination = {
            type: "momo",
            providerId: "m17",
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
}

export const payoutService = new PayoutService();
