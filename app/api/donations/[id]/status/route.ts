import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { donationService } from "@/services";
import { monimeService } from "@/lib/monime";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: donationId } = await params;

    // Validate donation ID format
    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return NextResponse.json(
        { error: "Invalid donation ID" },
        { status: 400 }
      );
    }

    // Get donation from database
    const donation = await donationService.getById(donationId);
    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // If donation is still pending and has a checkout session, check Monime status
    let checkoutSessionStatus = null;
    let currentDonation = donation;

    if (donation.status === "pending" && donation.provider.checkoutSessionId) {
      try {
        const checkoutSession = await monimeService.getCheckoutSession(
          donation.provider.checkoutSessionId
        );

        checkoutSessionStatus = {
          id: checkoutSession.result.id,
          status: checkoutSession.result.status,
          expiresAt: checkoutSession.result.expireTime,
        };

        // Auto-advance donation to payment_received if checkout session is completed
        if (checkoutSession.result.status === "completed" && donation.status === "pending") {
          try {
            await donationService.markPaymentReceived(donationId, {
              paymentId: checkoutSession.result.id,
              paymentMethod: { type: "checkout_session", provider: "MONIME" },
              completedAt: new Date().toISOString(),
            });

            // Re-fetch the updated donation to return fresh status
            const updatedDonation = await donationService.getById(donationId);
            if (updatedDonation) {
              currentDonation = updatedDonation;
            }
            console.log(`[status] Auto-advanced donation ${donationId} to payment_received`);
          } catch (markError) {
            // Log but don't fail - donation may have been updated by webhook already
            console.error("Error auto-advancing donation status:", markError);
          }
        }
      } catch (error) {
        console.error("Error fetching checkout session status:", error);
        // Continue without checkout session status if API call fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(currentDonation._id),
        status: currentDonation.status,
        amount: {
          currency: currentDonation.amount.currency,
          minor: currentDonation.amount.minor,
          major: currentDonation.amount.minor / 100, // Convert to major units for display
        },
        donor: currentDonation.isAnonymous ? null : currentDonation.donorSnapshot,
        message: currentDonation.message,
        provider: currentDonation.provider,
        createdAt: currentDonation.createdAt,
        updatedAt: currentDonation.updatedAt,
        checkoutSession: checkoutSessionStatus,
      },
    });
  } catch (error) {
    console.error("Error checking donation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
