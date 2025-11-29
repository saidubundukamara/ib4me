import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { monimeService, toMinorUnits, fromMinorUnits, MonimeApiError } from "@/lib/monime";
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

    // Check if campaign owner is verified
    if (!campaign.ownerVerification?.verified) {
      return NextResponse.json(
        {
          error: "This campaign cannot receive donations until the organizer completes identity verification.",
          code: "OWNER_NOT_VERIFIED"
        },
        { status: 403 }
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

    // Get fee settings and determine campaign type
    const feeSettings = await settingService.getFeeSettings();
    const campaignId = String(campaign._id);
    const campaignType = await campaignService.getCampaignType(campaignId);

    // Calculate fees (fees are added ON TOP of donation)
    const calculatedFees = settingService.calculateDonationFees(
      donationAmountMinor,
      campaignType,
      feeSettings
    );

    // Total amount to charge donor = donation + fees
    const totalChargedMinor = calculatedFees.totalChargedMinor;

    // Generate unique reference for this donation
    const reference = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending donation record with fee breakdown
    const donation = await donationService.createPending({
      campaignId: campaign._id as import("mongoose").Types.ObjectId,
      donorId: null, // Anonymous for now, could be linked later
      donorSnapshot: validatedData.donor || null,
      isAnonymous: validatedData.isAnonymous,
      message: validatedData.message || null,
      amountMinor: donationAmountMinor,        // What campaign receives
      totalChargedMinor,                        // What donor pays
      currency: validatedData.currency,
      provider: {
        name: "MONIME",
        paymentId: undefined,
        checkoutSessionId: undefined, // Will be updated after session creation
      },
      fees: {
        baseFeeMinor: calculatedFees.baseFeeMinor,
        processingFeeMinor: calculatedFees.processingFeeMinor,
        processingFeeBps: calculatedFees.processingFeeBps,
        campaignType: calculatedFees.campaignType,
        totalFeeMinor: calculatedFees.totalFeeMinor,
      },
      idempotencyKey: reference,
    });

    // Prepare success and cancel URLs
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const donationIdStr = String(donation._id);
    const campaignIdStr = String(campaign._id);
    const successUrl = `${baseUrl}/api/donations/success?donation_id=${donationIdStr}&campaign_slug=${encodeURIComponent(validatedData.campaignSlug)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/api/donations/cancel?donation_id=${donationIdStr}&campaign_slug=${encodeURIComponent(validatedData.campaignSlug)}`;
    // const webhookUrl = `${baseUrl}/api/donations/webhook`;

    // Create Monime checkout session with idempotency key
    // Note: We charge totalChargedMinor (donation + fees) to the donor
    // The campaign's financial account receives this amount, and we track fees separately
    // Build line item description (Monime has 100 char limit)
    const baseDescription = `Donation for ${campaign.diagnosis || 'medical campaign'}`;
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
      name: `Donation for ${campaign.patient?.name || campaign.diagnosis || "medical campaign"}`,
      successUrl,
      cancelUrl,
      financialAccountId: platformAccount.id, // Target platform account, NOT campaign
      lineItems: [{
        type: 'custom',
        name: `Donation for ${campaign.patient?.name || campaign.diagnosis || "medical campaign"}`,
        price: {
          currency: validatedData.currency,
          value: totalChargedMinor,  // Charge total amount (donation + fees) to donor
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
        // Fee metadata for transparency
        donationAmountMinor: donationAmountMinor.toString(),
        totalFeeMinor: calculatedFees.totalFeeMinor.toString(),
        campaignType: calculatedFees.campaignType,
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
        // Fee breakdown for display
        fees: {
          donationAmount: fromMinorUnits(donationAmountMinor, validatedData.currency),
          baseFee: fromMinorUnits(calculatedFees.baseFeeMinor, validatedData.currency),
          processingFee: fromMinorUnits(calculatedFees.processingFeeMinor, validatedData.currency),
          processingFeeRate: calculatedFees.processingFeeBps / 100, // As percentage
          totalFees: fromMinorUnits(calculatedFees.totalFeeMinor, validatedData.currency),
          totalCharged: fromMinorUnits(totalChargedMinor, validatedData.currency),
          currency: validatedData.currency,
          campaignType: calculatedFees.campaignType,
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