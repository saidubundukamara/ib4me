import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { donationService } from "@/services";

/**
 * GET /api/donations/[id]/breakdown
 *
 * The full waterfall for one donation: what the donor paid, what Monime took, what the
 * platform took, and what reached the campaign.
 *
 * Two rules this endpoint exists to honour:
 *
 * 1. **Never surface a single netted number.** Every deduction is named, so the figure can
 *    be explained rather than merely printed (MONIME-FEE-MODEL.md §8.1).
 * 2. **Once settled, return the persisted split verbatim.** A fee-setting change afterwards
 *    must not rewrite history — this reads what was recorded, never recomputes (§8.5).
 *
 * Before settlement there is no authoritative split, so the donor's original quote is
 * returned with `isEstimate: true`.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid donation ID" }, { status: 400 });
    }

    await connectDB();

    const donation = await donationService.getById(id);
    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    const currency = donation.amount.currency;
    const settled = donation.settlement?.appliedAt ? donation.settlement : null;

    if (settled) {
      return NextResponse.json({
        success: true,
        data: {
          status: donation.status,
          currency,
          isEstimate: false,
          grossMinor: settled.grossMinor,
          monimeFeeMinor: settled.monimeFeeMinor,
          // Whether Monime told us this figure or we assumed it. A caller reconciling
          // against a settlement statement must be able to tell the two apart (R12).
          monimeFeeSource: settled.monimeFeeSource,
          arrivedMinor: settled.arrivedMinor,
          platformFeeBps: settled.platformFeeBps,
          platformFeeMinor: settled.platformFeeMinor,
          campaignReceivesMinor: settled.campaignReceivesMinor,
          transferStatus: donation.transfer?.status ?? null,
          settledAt: settled.appliedAt,
          correctedAt: settled.correctedAt ?? null,
        },
      });
    }

    const quote = donation.quote;
    return NextResponse.json({
      success: true,
      data: {
        status: donation.status,
        currency,
        isEstimate: true,
        grossMinor: quote?.grossMinor ?? donation.amount.minor,
        monimeFeeMinor: quote?.monimeFeeMinorEstimate ?? null,
        monimeFeeSource: "estimated" as const,
        arrivedMinor:
          quote != null
            ? quote.grossMinor - quote.monimeFeeMinorEstimate
            : null,
        platformFeeBps: quote?.platformFeeBps ?? null,
        platformFeeMinor: quote?.platformFeeMinorEstimate ?? null,
        campaignReceivesMinor:
          quote?.campaignReceivesMinorEstimate ?? donation.campaignReceivesMinor ?? null,
        transferStatus: donation.transfer?.status ?? null,
        settledAt: null,
        correctedAt: null,
      },
    });
  } catch (error) {
    console.error("[api/donations/breakdown] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
