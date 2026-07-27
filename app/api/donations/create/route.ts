import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { monimeService, toMinorUnits, MonimeApiError } from "@/lib/monime";
import { computeDonationSplit } from "@/lib/fees";
import { donationService, settingService, campaignService } from "@/services";

const createDonationSchema = z.object({
  campaignSlug: z.string().min(1),
  amount: z.number().min(1).max(1000000), // Major units (e.g., $1 to $1M)
  currency: z.string().default("SLE"),
  donor: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  isAnonymous: z.boolean().default(false),
  message: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(), // ['mobile_money', 'card']
});

export async function POST(req: NextRequest) {
  
  try {
    const body = await req.json();
    const validatedData = createDonationSchema.parse(body);

    // Get campaign
    const campaign = await campaignService.getBySlug(validatedData.campaignSlug);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    

    // Check campaign status
    if (campaign.status !== "active") {
      return NextResponse.json(
        { error: "Campaign is not accepting donations" },
        { status: 400 }
      );
    }

    // Check if campaign has financial account
    if (!campaign.financial_account?.id) {
      return NextResponse.json(
        { error: "Campaign financial account not set up. Please contact support." },
        { status: 400 }
      );
    }


    // Get platform financial account (payments go here first)
    const platformAccount = await settingService.getPlatformAccountSettings();
    if (!platformAccount?.id) {
      return NextResponse.json(
        { error: "Platform payment processing not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Convert donation amount to minor units
    const donationAmountMinor = toMinorUnits(validatedData.amount, validatedData.currency);

    // Resolve the platform rate ONCE and persist it on the donation, so settlement can
    // reuse the rate that was quoted rather than whatever is configured by then (R4/R10).
    const feeSettings = await settingService.getFeeSettings();
    const campaignId = String(campaign._id);
    const campaignType = await campaignService.getCampaignType(campaignId);
    const platformFeeBps =
      campaignType === "organization"
        ? feeSettings.processingFee.organizationBps
        : feeSettings.processingFee.individualBps;

    // An ESTIMATE. Monime's fee isn't known until it settles, and the platform fee is a
    // percentage of what survives it — so the campaign figure here is approximate and is
    // labelled as such everywhere it is shown. The authoritative split is computed once,
    // at settlement, from the fee Monime actually reports.
    const quote = computeDonationSplit({
      grossMinor: donationAmountMinor,
      platformFeeBps,
      monimeFeeBpsFallback: feeSettings.monimeCollectionFeeBpsEstimate,
    });

    // The donor pays exactly what they typed. Fees come out of it, never on top of it.
    const totalChargedMinor = donationAmountMinor;

    // Generate unique reference for this donation
    const reference = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending donation record with fee breakdown
    const donation = await donationService.createPending({
      campaignId: campaign._id as import("mongoose").Types.ObjectId,
      donorId: null, // Anonymous for now, could be linked later
      donorSnapshot: validatedData.donor || null,
      isAnonymous: validatedData.isAnonymous,
      message: validatedData.message || null,
      amountMinor: donationAmountMinor,  // What the donor entered, and is charged
      totalChargedMinor,
      campaignReceivesMinor: quote.campaignReceivesMinor,  // Estimate until settlement
      currency: validatedData.currency,
      provider: {
        name: "MONIME",
        paymentId: undefined,
        checkoutSessionId: undefined, // Will be updated after session creation
      },
      quote: {
        grossMinor: quote.grossMinor,
        monimeFeeBpsEstimate: feeSettings.monimeCollectionFeeBpsEstimate,
        monimeFeeMinorEstimate: quote.monimeFeeMinor,
        platformFeeBps: quote.platformFeeBps,
        platformFeeMinorEstimate: quote.platformFeeMinor,
        campaignReceivesMinorEstimate: quote.campaignReceivesMinor,
      },
      campaignType,
      idempotencyKey: reference,
    });

    // Prepare success and cancel URLs
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const donationIdStr = String(donation._id);
    const campaignIdStr = String(campaign._id);
    const successUrl = `${baseUrl}/api/donations/success?donation_id=${donationIdStr}&campaign_slug=${encodeURIComponent(validatedData.campaignSlug)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/api/donations/cancel?donation_id=${donationIdStr}&campaign_slug=${encodeURIComponent(validatedData.campaignSlug)}`;
    // const webhookUrl = `${baseUrl}/api/donations/webhook`;

    // Create Monime checkout session with idempotency key.
    // The donor is charged exactly the amount they entered — Monime nets its cut out of
    // it before settlement, and the platform fee comes out of what remains.
    // Build line item description (Monime has 100 char limit)
    const baseDescription = `Donation for ${campaign.details || 'campaign'}`;
    let lineItemDescription = baseDescription;
    if (validatedData.message) {
      const withMessage = `${baseDescription} - ${validatedData.message}`;
      lineItemDescription = withMessage.length <= 100 ? withMessage : `${withMessage.substring(0, 97)}...`;
    }
    // Ensure description is within 100 char limit
    if (lineItemDescription.length > 100) {
      lineItemDescription = `${lineItemDescription.substring(0, 97)}...`;
    }

    // Create checkout session targeting PLATFORM account (not campaign)
    // Funds will be transferred to campaign after payment completion
    const checkoutSession = await monimeService.createCheckoutSession({
      name: `Donation for ${campaign.beneficiary?.name || campaign.details || "campaign"}`,
      successUrl,
      cancelUrl,
      financialAccountId: platformAccount.id, // Target platform account, NOT campaign
      lineItems: [{
        type: 'custom',
        name: `Donation for ${campaign.beneficiary?.name || campaign.details || "campaign"}`,
        price: {
          currency: validatedData.currency,
          value: totalChargedMinor,  // Exactly what the donor entered
        },
        quantity: 1,
        description: lineItemDescription,
        reference,
      }],
      metadata: {
        donationId: donationIdStr,
        campaignId: campaignIdStr,
        campaignSlug: validatedData.campaignSlug,
        isAnonymous: validatedData.isAnonymous.toString(),
        donorName: validatedData.donor?.name || 'Anonymous',
        // Campaign financial account for internal transfer after payment
        campaignFinancialAccountId: campaign.financial_account.id,
        platformFinancialAccountId: platformAccount.id,
        // Fee metadata for transparency (estimates — see the quote above)
        donationAmountMinor: donationAmountMinor.toString(),
        platformFeeBps: platformFeeBps.toString(),
        campaignType,
      },
      callbackState: reference,
    }, reference); // Use reference as idempotency key
  

    // Update donation with checkout session ID
    await donationService.updateCheckoutSession(donationIdStr, checkoutSession.id);

    return NextResponse.json({
      success: true,
      data: {
        donationId: donationIdStr,
        checkoutUrl: checkoutSession.redirectUrl,
        checkoutSessionId: checkoutSession.id,
        expiresAt: checkoutSession.expiresAt,
        // Fee breakdown, in MINOR UNITS plus the rates. The client formats; it never
        // redoes the arithmetic. A client that recomputes bps on major units disagrees
        // with the server on almost every amount (MONIME-FEE-MODEL.md §8.8).
        fees: {
          currency: validatedData.currency,
          campaignType,
          grossMinor: quote.grossMinor,
          totalChargedMinor,
          monimeFeeMinorEstimate: quote.monimeFeeMinor,
          monimeFeeBps: feeSettings.monimeCollectionFeeBpsEstimate,
          platformFeeMinorEstimate: quote.platformFeeMinor,
          platformFeeBps: quote.platformFeeBps,
          campaignReceivesMinorEstimate: quote.campaignReceivesMinor,
          /** Every campaign-side figure above is an estimate until Monime settles. */
          isEstimate: true,
        }
      }
    });

  } catch (error) {
    console.error("Error creating donation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof MonimeApiError) {
      return NextResponse.json(
        { 
          error: "Payment processing error", 
          message: error.message,
          code: error.code 
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}