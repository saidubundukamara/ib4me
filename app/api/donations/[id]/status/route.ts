import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { donationService } from "@/services";
import { monimeService } from "@/lib/monime";

export async function GET(
  req: NextRequest,
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
    if (donation.status === "pending" && donation.provider.checkoutSessionId) {
      try {
        const checkoutSession = await monimeService.getCheckoutSession(
          donation.provider.checkoutSessionId
        );
        checkoutSessionStatus = {
          id: checkoutSession.id,
          status: checkoutSession.status,
          expiresAt: checkoutSession.expiresAt,
        };
      } catch (error) {
        console.error("Error fetching checkout session status:", error);
        // Continue without checkout session status if API call fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(donation._id),
        status: donation.status,
        amount: {
          currency: donation.amount.currency,
          minor: donation.amount.minor,
          major: donation.amount.minor / 100, // Convert to major units for display
        },
        donor: donation.isAnonymous ? null : donation.donorSnapshot,
        message: donation.message,
        provider: donation.provider,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
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
