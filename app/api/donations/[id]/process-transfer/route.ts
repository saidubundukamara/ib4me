import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { donationService, settingService } from "@/services";
import { monimeService } from "@/lib/monime";

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

    // Get checkout session to retrieve metadata
    if (!donation.provider.checkoutSessionId) {
      return NextResponse.json({
        success: false,
        error: "Missing checkout session ID",
        status: donation.status
      }, { status: 400 });
    }

    const checkoutSession = await monimeService.getCheckoutSession(
      donation.provider.checkoutSessionId
    );

    // Get campaign financial account ID from metadata (inside result object)
    const campaignFinancialAccountId = checkoutSession.result.metadata?.campaignFinancialAccountId;
    if (typeof campaignFinancialAccountId !== "string" || !campaignFinancialAccountId) {
      console.error(`No campaignFinancialAccountId in metadata for donation ${donationId}`);
      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Missing campaign financial account ID in metadata",
        initiatedAt: new Date(),
        retryCount: (donation.transfer?.retryCount || 0) + 1
      });
      return NextResponse.json({
        success: false,
        error: "Missing campaign financial account configuration",
        status: donation.status
      }, { status: 400 });
    }

    // Get platform account
    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      console.error(`Platform account not configured for donation ${donationId}`);
      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: "Platform financial account not configured",
        initiatedAt: new Date(),
        retryCount: (donation.transfer?.retryCount || 0) + 1
      });
      return NextResponse.json({
        success: false,
        error: "Platform account not configured",
        status: donation.status
      }, { status: 500 });
    }

    // Transfer only what campaign is entitled to receive after fees.
    // Falls back to amount.minor for legacy donations created before campaignReceivesMinor existed.
    const transferAmount = donation.campaignReceivesMinor ?? donation.amount.minor;
    // Use deterministic idempotency key to prevent duplicate transfers
    const idempotencyKey = `donation_transfer_${donationId}`;

    try {
      console.log(`[process-transfer] Initiating internal transfer of ${transferAmount} for donation ${donationId}`);

      // Mark transfer as pending
      await donationService.updateTransferStatus(donationId, {
        status: "pending",
        initiatedAt: new Date(),
        retryCount: donation.transfer?.retryCount || 0
      });

      const transfer = await monimeService.createInternalTransfer({
        amount: {
          currency: donation.amount.currency,
          value: transferAmount,
        },
        sourceFinancialAccount: {
          id: platformAccount.id,
        },
        destinationFinancialAccount: {
          id: campaignFinancialAccountId,
        },
        description: `Donation transfer for ${donationId}`,
        metadata: {
          donationId,
          type: "donation_transfer",
          source: "success_page" // Track that this was triggered from success page
        },
      }, idempotencyKey);

      console.log(`[process-transfer] Transfer created: ${transfer.id}, status: ${transfer.status}`);

      // Handle transfer result
      if (transfer.status === "completed") {
        await donationService.completeWithTransfer(donationId, transfer.id);
        console.log(`[process-transfer] Successfully completed donation ${donationId} with transfer ${transfer.id}`);
        return NextResponse.json({
          success: true,
          message: "Donation completed successfully",
          status: "succeeded",
          transfer: {
            id: transfer.id,
            status: "completed"
          }
        });
      } else if (transfer.status === "failed") {
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "failed",
          failureReason: transfer.failureReason || "Transfer failed",
          retryCount: (donation.transfer?.retryCount || 0) + 1
        });
        console.error(`[process-transfer] Transfer failed for donation ${donationId}: ${transfer.failureReason}`);
        return NextResponse.json({
          success: false,
          error: transfer.failureReason || "Transfer failed",
          status: donation.status,
          transfer: {
            id: transfer.id,
            status: "failed"
          }
        });
      } else {
        // Transfer is pending/processing
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "pending",
        });
        console.log(`[process-transfer] Transfer ${transfer.id} is ${transfer.status}, waiting for completion`);
        return NextResponse.json({
          success: false,
          message: "Transfer in progress",
          status: donation.status,
          transfer: {
            id: transfer.id,
            status: transfer.status
          },
          requiresPolling: true
        });
      }
    } catch (transferError) {
      console.error(`[process-transfer] Transfer API error for donation ${donationId}:`, transferError);
      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: transferError instanceof Error ? transferError.message : "Transfer API error",
        retryCount: (donation.transfer?.retryCount || 0) + 1
      });
      return NextResponse.json({
        success: false,
        error: "Failed to initiate transfer",
        details: transferError instanceof Error ? transferError.message : "Unknown error",
        status: donation.status
      }, { status: 500 });
    }
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
