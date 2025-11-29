import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { monimeService } from "@/lib/monime";
import { donationService, settingService } from "@/services";

/**
 * POST/GET /api/donations/success
 *
 * Monime redirects here after payment completion.
 * This handler:
 * 1. Verifies the checkout session with Monime
 * 2. Marks donation as payment_received
 * 3. Initiates internal transfer to campaign
 * 4. Redirects user to success UI page
 */
async function handleSuccessRedirect(req: NextRequest) {
  const url = new URL(req.url);
  const donationId = url.searchParams.get("donation_id");
  const campaignSlug = url.searchParams.get("campaign_slug");
  const sessionId = url.searchParams.get("session_id");

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Build redirect URL helper
  const redirectToUI = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return NextResponse.redirect(`${baseUrl}/campaigns/${campaignSlug}/donate/success?${searchParams.toString()}`);
  };

  // Validate required params
  if (!donationId || !campaignSlug) {
    console.error("[api/donations/success] Missing required params:", { donationId, campaignSlug });
    return redirectToUI({ status: "error", message: "missing_params" });
  }

  // Validate donation ID format
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    console.error("[api/donations/success] Invalid donation ID format:", donationId);
    return redirectToUI({ status: "error", message: "invalid_donation" });
  }

  try {
    // 1. Get donation from database
    const donation = await donationService.getById(donationId);
    if (!donation) {
      console.error("[api/donations/success] Donation not found:", donationId);
      return redirectToUI({ status: "error", message: "not_found" });
    }

    // 2. If already succeeded, just redirect to success
    if (donation.status === "succeeded") {
      console.log("[api/donations/success] Donation already succeeded:", donationId);
      return redirectToUI({ donation_id: donationId, status: "succeeded" });
    }

    // 3. Get checkout session ID
    const checkoutSessionId = donation.provider?.checkoutSessionId || sessionId;
    if (!checkoutSessionId) {
      console.error("[api/donations/success] No checkout session ID:", donationId);
      return redirectToUI({ donation_id: donationId, status: "pending" });
    }

    // 4. Verify checkout session with Monime
    const session = await monimeService.getCheckoutSession(checkoutSessionId);
    console.log("[api/donations/success] Checkout session status:", session.result?.status);

    if (session.result?.status !== "completed") {
      // Payment not yet confirmed by Monime, redirect with pending
      console.log("[api/donations/success] Payment not yet completed:", donationId);
      return redirectToUI({ donation_id: donationId, status: "pending" });
    }

    // 5. Mark as payment received if still pending
    if (donation.status === "pending") {
      console.log("[api/donations/success] Marking payment received:", donationId);
      await donationService.markPaymentReceived(donationId, {
        paymentId: session.result.id,
        paymentMethod: { type: "checkout_session", provider: "MONIME" },
        completedAt: new Date().toISOString(),
      });
    }

    // 6. Get campaign financial account from metadata
    const campaignFinancialAccountId = session.result.metadata?.campaignFinancialAccountId;
    if (!campaignFinancialAccountId) {
      console.error("[api/donations/success] No campaign financial account in metadata:", donationId);
      return redirectToUI({ donation_id: donationId, status: "error", message: "missing_account" });
    }

    // 7. Get platform account
    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      console.error("[api/donations/success] Platform account not configured:", donationId);
      return redirectToUI({ donation_id: donationId, status: "error", message: "platform_error" });
    }

    // 8. Initiate internal transfer with deterministic idempotency key
    const idempotencyKey = `donation_transfer_${donationId}`;
    const transferAmount = donation.amount.minor;

    console.log("[api/donations/success] Initiating transfer:", {
      donationId,
      amount: transferAmount,
      from: platformAccount.id,
      to: campaignFinancialAccountId,
    });

    try {
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
          source: "success_callback",
        },
      }, idempotencyKey);

      console.log("[api/donations/success] Transfer result:", {
        id: transfer.id,
        status: transfer.status,
      });

      // 9. Update donation based on transfer result
      if (transfer.status === "completed") {
        await donationService.completeWithTransfer(donationId, transfer.id);
        console.log("[api/donations/success] Donation completed:", donationId);
        return redirectToUI({ donation_id: donationId, status: "succeeded" });
      } else if (transfer.status === "failed") {
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "failed",
          failureReason: transfer.failureReason || "Transfer failed",
          initiatedAt: new Date(),
        });
        console.error("[api/donations/success] Transfer failed:", donationId, transfer.failureReason);
        return redirectToUI({ donation_id: donationId, status: "error", message: "transfer_failed" });
      } else {
        // Transfer pending - webhook will complete it
        await donationService.updateTransferStatus(donationId, {
          id: transfer.id,
          status: "pending",
          initiatedAt: new Date(),
        });
        console.log("[api/donations/success] Transfer pending, webhook will complete:", donationId);
        return redirectToUI({ donation_id: donationId, status: "transferring" });
      }
    } catch (transferError) {
      console.error("[api/donations/success] Transfer error:", transferError);
      // Still redirect to UI, webhook can retry
      return redirectToUI({ donation_id: donationId, status: "transferring" });
    }
  } catch (error) {
    console.error("[api/donations/success] Error:", error);
    return redirectToUI({ donation_id: donationId || "", status: "error", message: "server_error" });
  }
}

// Monime POSTs to success URL
export async function POST(req: NextRequest) {
  return handleSuccessRedirect(req);
}

// Also handle GET for manual navigation or fallback
export async function GET(req: NextRequest) {
  return handleSuccessRedirect(req);
}
