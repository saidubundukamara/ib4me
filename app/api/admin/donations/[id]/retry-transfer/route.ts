import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { donationService, settingService, campaignService } from "@/services";
import { monimeService } from "@/lib/monime";

const MAX_RETRY_ATTEMPTS = 5;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    let adminContext;
    try {
      adminContext = await validateAdminAuth();
    } catch (authError) {
      if (authError instanceof AdminAuthError) {
        return NextResponse.json(
          { error: authError.message },
          { status: authError.statusCode }
        );
      }
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: donationId } = await params;

    // Get donation
    const donation = await donationService.getById(donationId);
    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Verify donation is in payment_received status
    if (donation.status !== "payment_received") {
      return NextResponse.json(
        {
          error: `Cannot retry transfer for donation in status: ${donation.status}`,
          currentStatus: donation.status
        },
        { status: 400 }
      );
    }

    // Check retry count
    const currentRetryCount = donation.transfer?.retryCount || 0;
    if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`,
          retryCount: currentRetryCount
        },
        { status: 400 }
      );
    }

    // Get campaign to retrieve financial account
    const campaign = await campaignService.getById(donation.campaignId.toString());
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!campaign.financial_account?.id) {
      return NextResponse.json(
        { error: "Campaign financial account not configured" },
        { status: 400 }
      );
    }

    // Get platform account
    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      return NextResponse.json(
        { error: "Platform financial account not configured" },
        { status: 500 }
      );
    }

    // Attempt transfer
    const transferAmount = donation.amount.minor;
    const idempotencyKey = `transfer_retry_${donationId}_${Date.now()}`;

    try {
      console.log(`[Admin] Retrying internal transfer for donation ${donationId}, attempt ${currentRetryCount + 1}`);

      // Update transfer status to pending
      await donationService.updateTransferStatus(donationId, {
        status: "pending",
        initiatedAt: new Date(),
        retryCount: currentRetryCount + 1
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
          id: campaign.financial_account.id,
        },
        description: `Donation transfer retry for ${donationId}`,
        metadata: {
          donationId,
          type: "donation_transfer_retry",
          retryCount: currentRetryCount + 1,
          retryInitiatedBy: adminContext.adminId.toString(),
        },
      }, idempotencyKey);

      console.log(`[Admin] Internal transfer created: ${transfer.id}, status: ${transfer.status}`);

      if (transfer.status === "completed") {
        // Complete the donation
        await donationService.completeWithTransfer(donationId, transfer.id);

        return NextResponse.json({
          success: true,
          message: "Transfer completed successfully",
          transferId: transfer.id,
          donationStatus: "succeeded"
        });
      } else if (transfer.status === "failed") {
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "failed",
          failureReason: transfer.failureReason || "Transfer failed",
          retryCount: currentRetryCount + 1
        });

        return NextResponse.json({
          success: false,
          error: "Transfer failed",
          failureReason: transfer.failureReason,
          transferId: transfer.id,
          retryCount: currentRetryCount + 1
        }, { status: 400 });
      } else {
        // Transfer is pending/processing
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "pending",
          retryCount: currentRetryCount + 1
        });

        return NextResponse.json({
          success: true,
          message: `Transfer initiated, status: ${transfer.status}`,
          transferId: transfer.id,
          transferStatus: transfer.status
        });
      }
    } catch (transferError) {
      console.error(`[Admin] Transfer retry failed for donation ${donationId}:`, transferError);

      await donationService.updateTransferStatus(donationId, {
        status: "failed",
        failureReason: transferError instanceof Error ? transferError.message : "Transfer API error",
        retryCount: currentRetryCount + 1
      });

      return NextResponse.json({
        success: false,
        error: "Transfer failed",
        message: transferError instanceof Error ? transferError.message : "Unknown error",
        retryCount: currentRetryCount + 1
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in retry-transfer endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
