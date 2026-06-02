import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { monimeService } from "@/lib/monime";
import { donationService } from "@/services";

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
    return NextResponse.redirect(`${baseUrl}/campaigns/${campaignSlug}/donate/success?${searchParams.toString()}`, { status: 302 });
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

    // 6. Move funds to the campaign account and settle the donation. Shared
    // with the payment webhook so both paths behave identically (account
    // resolution, idempotency, polling). The webhook is the reliable fallback
    // when the donor never returns to this redirect.
    const result = await donationService.settleTransfer(donationId, {
      source: "success_callback",
    });
    console.log("[api/donations/success] settleTransfer:", donationId, result.status);

    if (result.status === "completed") {
      return redirectToUI({ donation_id: donationId, status: "succeeded" });
    }
    if (result.status === "failed") {
      return redirectToUI({ donation_id: donationId, status: "error", message: "transfer_failed" });
    }
    // Still processing — client polling / webhook will finish it.
    return redirectToUI({ donation_id: donationId, status: "transferring" });
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
