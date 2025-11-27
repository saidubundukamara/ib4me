import mongoose from "mongoose";

export type LedgerRefType =
  | "donation"              // Campaign receives donation (legacy)
  | "payout"                // Withdrawal from campaign
  | "adjustment"            // Manual adjustment
  | "donation_refund"       // Refund
  | "platform_receipt"      // Payment received to platform account
  | "platform_fee"          // Fee retained by platform
  | "platform_transfer_out" // Transfer out from platform to campaign
  | "campaign_transfer_in"; // Transfer in to campaign from platform

export type LedgerAccountType = "campaign" | "platform";

export interface ILedgerEntry extends mongoose.Document {
  campaignId?: mongoose.Types.ObjectId | null;  // Optional for platform-level entries
  accountType: LedgerAccountType;               // Which account this entry affects
  refType: LedgerRefType;
  refId?: mongoose.Types.ObjectId | null;
  direction: "in" | "out";
  amountMinor: number;
  currency: string;
  transferId?: string | null;                   // Monime transfer ID for reconciliation
  description?: string | null;                  // Optional description
  createdAt: Date;
}

const ledgerEntrySchema = new mongoose.Schema<ILedgerEntry>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true,
    },
    accountType: {
      type: String,
      enum: ["campaign", "platform"],
      required: true,
      default: "campaign",
      index: true,
    },
    refType: {
      type: String,
      enum: [
        "donation",
        "payout",
        "adjustment",
        "donation_refund",
        "platform_receipt",
        "platform_fee",
        "platform_transfer_out",
        "campaign_transfer_in"
      ],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    direction: { type: String, enum: ["in", "out"], required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    transferId: { type: String, default: null },
    description: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerEntrySchema.index({ campaignId: 1, createdAt: -1 });
ledgerEntrySchema.index({ accountType: 1, createdAt: -1 });
ledgerEntrySchema.index({ refType: 1, createdAt: -1 });

export default mongoose.models.LedgerEntry ||
  mongoose.model<ILedgerEntry>("LedgerEntry", ledgerEntrySchema);
