import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { donationService } from "@/services";

/**
 * POST /api/donations/[id]/process-transfer
 *
 * Triggers the internal transfer of funds from platform account to campaign account.
 * This is the PRIMARY trigger for fund transfer (called from success page).
 * The webhook acts as a backup if this endpoint fails.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("Processing transfer for donation");
  try {
    const { id: donationId } = await params;

    // Validate donation ID format
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return NextResponse.json(
        { error: "Invalid donation ID", success: false },
        { status: 400 }
      );
    }

    // Get donation from database
    const donation = await donationService.getById(donationId);
    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found", success: false },
        { status: 404 }
      );
    }

    // If already succeeded, return success
    if (donation.status === "succeeded") {
      return NextResponse.json({
        success: true,
        message: "Donation already completed",
        status: donation.status,
        transfer: donation.transfer
      });
    }

    // If transfer already completed, just complete the donation
    if (donation.transfer?.status === "completed" && donation.transfer?.id) {
      // Transfer done but donation not marked succeeded - complete it now
      await donationService.completeWithTransfer(donationId, donation.transfer.id);
      return NextResponse.json({
        success: true,
        message: "Donation completed",
        status: "succeeded"
      });
    }

    // Only process if payment has been received
    if (donation.status !== "payment_received") {
      return NextResponse.json({
        success: false,
        message: "Payment not yet confirmed",
        status: donation.status,
        requiresPolling: donation.status === "pending"
      });
    }

    // Delegate to settleTransfer — the single transfer implementation, shared with the
    // payment webhook and the reconciliation sweep so the three cannot diverge.
    //
    // This route used to carry its own copy, which had drifted in two ways: it read the
    // destination account from checkout-session metadata rather than from the campaign
    // record (authoritative), and it moved `donation.amount.minor` — the gross — rather
    // than the persisted split (R14).
    const outcome = await donationService.settleTransfer(donationId, {
      source: "success_page",
    });

    if (outcome.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Donation completed successfully",
        status: "succeeded",
        transfer: { id: outcome.transferId, status: "completed" },
      });
    }

    if (outcome.status === "failed") {
      return NextResponse.json({
        success: false,
        error: outcome.reason || "Transfer failed",
        status: donation.status,
        transfer: { id: outcome.transferId, status: "failed" },
      });
    }

    return NextResponse.json({
      success: false,
      message: "Transfer in progress",
      status: donation.status,
      transfer: { id: outcome.transferId, status: "pending" },
      requiresPolling: true,
    });
  } catch (error) {
    console.error("[process-transfer] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false
      },
      { status: 500 }
    );
  }
}
