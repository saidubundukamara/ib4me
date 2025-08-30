import mongoose from "mongoose";
import {
  donationRepository,
  campaignRepository,
  ledgerEntryRepository,
} from "../repositories";
import { IDonation } from "../models/Donation";
import { runInTransaction, ServiceSession } from "./ServiceTransaction";

export interface CreateDonationInput {
  campaignId: mongoose.Types.ObjectId;
  donorId?: mongoose.Types.ObjectId | null;
  donorSnapshot?: { name?: string; email?: string } | null;
  isAnonymous?: boolean;
  message?: string | null;
  amountMinor: number;
  currency: string;
  provider: { name: string; paymentId?: string; checkoutSessionId?: string };
  idempotencyKey?: string | null;
}

export class DonationService {
  async createPending(input: CreateDonationInput): Promise<IDonation> {
    const existing = input.idempotencyKey
      ? await donationRepository.findByIdempotencyKey(input.idempotencyKey)
      : null;
    if (existing) return existing;

    return donationRepository.create({
      campaignId: input.campaignId,
      donorId: input.donorId ?? null,
      donorSnapshot: input.donorSnapshot ?? null,
      isAnonymous: Boolean(input.isAnonymous),
      message: input.message ?? null,
      amount: { currency: input.currency, minor: input.amountMinor },
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

  async getById(donationId: string): Promise<IDonation | null> {
    return donationRepository.findById(donationId);
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

      // Calculate fees and net amount
      const fees = paymentDetails.fees ? {
        paymentFeeMinor: Math.round(paymentDetails.fees.total),
        platformFeeMinor: 0, // We can add platform fees later
      } : undefined;
      
      const netAmountMinor = donation.amount.minor - (fees?.paymentFeeMinor || 0);

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
}

export const donationService = new DonationService();
