import mongoose from "mongoose";

export type LedgerRefType =
  | "donation"              // Campaign receives donation (legacy)
  | "payout"                // Withdrawal from campaign
  | "adjustment"            // Manual adjustment
  | "donation_refund"       // Refund
  | "platform_receipt"      // Gross payment collected into the platform account
  | "processor_fee"         // What Monime kept before the money reached us
  | "platform_fee"          // Fee earned by the platform
  | "platform_fee_variance" // Late fee correction that arrived after the money moved (R6)
  | "platform_transfer_out" // Transfer out from platform to campaign
  | "campaign_transfer_in"  // Transfer in to campaign from platform
  | "tip_receipt";          // A platform tip collected into the tip account

/**
 * `platform`, `campaign` and `platform_tips` are physical Monime financial accounts —
 * each reconciles against its OWN Monime balance. `platform_revenue` is a memo account
 * recognising fees we have earned; the cash itself stays in the platform account, so it
 * is not a separate balance to reconcile.
 *
 * `platform_tips` must never be collapsed into `platform`. They are different Monime
 * accounts (`tipFinancialAccount` vs `platformFinancialAccount`), and booking tips against
 * `platform` would inflate that ledger by every tip ever taken, breaking the zero-tolerance
 * reconciliation the moment the first tip settled.
 *
 * Nothing currently moves money OUT of the tip account. If a sweep or a Monime-side tip
 * refund ever happens, it must be booked here as an `adjustment` — otherwise the tip
 * account silently loses zero tolerance with no named cause.
 */
export type LedgerAccountType =
  | "campaign"
  | "platform"
  | "platform_revenue"
  | "platform_tips";

export interface ILedgerEntry extends mongoose.Document {
  campaignId?: mongoose.Types.ObjectId | null;  // Optional for platform-level entries
  accountType: LedgerAccountType;               // Which account this entry affects
  refType: LedgerRefType;
  refId?: mongoose.Types.ObjectId | null;
  direction: "in" | "out";
  amountMinor: number;
  currency: string;
  transferId?: string | null;                   // Monime transfer ID for reconciliation
  monimeRef?: string | null;                    // Monime payment/payout id (spm-…, pyt-…)
  /**
   * The idempotency gate. A unique key per intended movement, so a replayed webhook
   * cannot double-post — the ledger write itself is what fails, before any counter is
   * incremented (MONIME-FEE-MODEL.md §6). Use `LedgerEntryRepository.createIdempotent`,
   * which reports whether the entry actually moved.
   */
  idempotencyKey?: string;
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
      enum: ["campaign", "platform", "platform_revenue", "platform_tips"],
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
        "processor_fee",
        "platform_fee",
        "platform_fee_variance",
        "platform_transfer_out",
        "campaign_transfer_in",
        "tip_receipt"
      ],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    direction: { type: String, enum: ["in", "out"], required: true },
    // Zero-amount lines are illegal (R5) — a tiny donation can floor its platform fee to
    // zero, and the correct response is to omit the entry, not to post an empty one.
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true },
    transferId: { type: String, default: null },
    monimeRef: { type: String, default: null },
    // No `default: null` — see the index comment below.
    idempotencyKey: { type: String },
    description: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerEntrySchema.index({ campaignId: 1, createdAt: -1 });
ledgerEntrySchema.index({ accountType: 1, createdAt: -1 });
ledgerEntrySchema.index({ refType: 1, createdAt: -1 });

/**
 * What makes the ledger replay-safe.
 *
 * `partialFilterExpression` rather than `sparse`, and the field deliberately has no
 * `default: null`: a sparse unique index skips only *missing* fields, so any row carrying
 * an explicit `null` would collide with every other such row. Pre-existing entries (all
 * of which predate this field) are simply absent from the index.
 */
ledgerEntrySchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export default mongoose.models.LedgerEntry ||
  mongoose.model<ILedgerEntry>("LedgerEntry", ledgerEntrySchema);
