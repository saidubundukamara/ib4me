import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { donationService } from "@/services";

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

    // Delegate to settleTransfer — the single transfer implementation. It resolves the
    // platform and campaign accounts itself, moves the persisted split rather than the
    // gross (R14), and reuses the deterministic `donation_transfer_<id>` idempotency key.
    //
    // That last part is the point of this rewrite. This route previously built its key as
    // `transfer_retry_<id>_<Date.now()>` — a fresh key on every attempt, which defeats
    // Monime's idempotency entirely: each retry was a NEW transfer request, so retrying a
    // transfer that had actually succeeded would send the money a second time.
    console.log(
      `[Admin] Retrying internal transfer for donation ${donationId}, ` +
        `attempt ${currentRetryCount + 1}, by ${adminContext.adminId.toString()}`
    );

    const outcome = await donationService.settleTransfer(donationId, {
      source: "admin_retry",
    });

    if (outcome.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Transfer completed successfully",
        transferId: outcome.transferId,
        donationStatus: "succeeded",
      });
    }

    if (outcome.status === "failed") {
      return NextResponse.json(
        {
          success: false,
          error: "Transfer failed",
          failureReason: outcome.reason,
          transferId: outcome.transferId,
          retryCount: currentRetryCount + 1,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transfer initiated, still pending",
      transferId: outcome.transferId,
      transferStatus: "pending",
    });
  } catch (error) {
    console.error("Error in retry-transfer endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
