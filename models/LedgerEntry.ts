import mongoose from "mongoose";

export type LedgerRefType = "donation" | "payout" | "adjustment";

export interface ILedgerEntry extends mongoose.Document {
  campaignId: mongoose.Types.ObjectId;
  refType: LedgerRefType;
  refId?: mongoose.Types.ObjectId | null;
  direction: "in" | "out";
  amountMinor: number;
  currency: string;
  createdAt: Date;
}

const ledgerEntrySchema = new mongoose.Schema<ILedgerEntry>(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    refType: {
      type: String,
      enum: ["donation", "payout", "adjustment"],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    direction: { type: String, enum: ["in", "out"], required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerEntrySchema.index({ campaignId: 1, createdAt: -1 });

export default mongoose.models.LedgerEntry ||
  mongoose.model<ILedgerEntry>("LedgerEntry", ledgerEntrySchema);
