import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { donationService } from "@/services";

/**
 * POST/GET /api/donations/cancel
 *
 * Monime redirects here when user cancels payment.
 * This handler:
 * 1. Marks the donation as cancelled (if still pending)
 * 2. Redirects user to cancel UI page
 */
async function handleCancelRedirect(req: NextRequest) {
  const url = new URL(req.url);
  const donationId = url.searchParams.get("donation_id");
  const campaignSlug = url.searchParams.get("campaign_slug");

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Build redirect URL helper
  const redirectToUI = (slug: string, params?: Record<string, string>) => {
    const searchParams = params ? `?${new URLSearchParams(params).toString()}` : "";
    return NextResponse.redirect(`${baseUrl}/campaigns/${slug}/donate/cancel${searchParams}`);
  };

  // Validate required params
  if (!campaignSlug) {
    console.error("[api/donations/cancel] Missing campaign_slug");
    // Redirect to campaigns page if no slug
    return NextResponse.redirect(`${baseUrl}/campaigns`);
  }

  // If no donation ID, just redirect to cancel page
  if (!donationId) {
    console.log("[api/donations/cancel] No donation ID, redirecting to cancel page");
    return redirectToUI(campaignSlug);
  }

  // Validate donation ID format
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    console.error("[api/donations/cancel] Invalid donation ID format:", donationId);
    return redirectToUI(campaignSlug);
  }

  try {
    // Get donation from database
    const donation = await donationService.getById(donationId);

    if (!donation) {
      console.error("[api/donations/cancel] Donation not found:", donationId);
      return redirectToUI(campaignSlug);
    }

    // Only mark as cancelled if still pending
    if (donation.status === "pending") {
      console.log("[api/donations/cancel] Marking donation as cancelled:", donationId);
      await donationService.markFailed(donationId, "Payment cancelled by user");
    } else {
      console.log("[api/donations/cancel] Donation not pending, skipping cancel:", {
        donationId,
        status: donation.status,
      });
    }

    return redirectToUI(campaignSlug, { donation_id: donationId, status: "302" });
  } catch (error) {
    console.error("[api/donations/cancel] Error:", error);
    return redirectToUI(campaignSlug, { status: "302" });
  }
}

// Monime POSTs to cancel URL
export async function POST(req: NextRequest) {
  return handleCancelRedirect(req);
}

// Also handle GET for manual navigation or fallback
export async function GET(req: NextRequest) {
  return handleCancelRedirect(req);
}
