import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { monimeService, toMinorUnits, MonimeApiError } from "@/lib/monime";
import { donationService } from "@/services";
import { campaignService } from "@/services";

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

    // Convert amount to minor units
    const amountMinor = toMinorUnits(validatedData.amount, validatedData.currency);

    // Generate unique reference for this donation
    const reference = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending donation record
    const donation = await donationService.createPending({
      campaignId: campaign._id as import("mongoose").Types.ObjectId,
      donorId: null, // Anonymous for now, could be linked later
      donorSnapshot: validatedData.donor || null,
      isAnonymous: validatedData.isAnonymous,
      message: validatedData.message || null,
      amountMinor,
      currency: validatedData.currency,
      provider: {
        name: "MONIME",
        paymentId: undefined,
        checkoutSessionId: undefined, // Will be updated after session creation
      },
      idempotencyKey: reference,
    });

    // Prepare success and cancel URLs
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const donationIdStr = String(donation._id);
    const campaignIdStr = String(campaign._id);
    const successUrl = `${baseUrl}/campaigns/${validatedData.campaignSlug}/donate/success?donation_id=${donationIdStr}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/campaigns/${validatedData.campaignSlug}/donate/cancel?donation_id=${donationIdStr}`;
    const webhookUrl = `${baseUrl}/api/donations/webhook`;

    // Create Monime checkout session with idempotency key
    const checkoutSession = await monimeService.createCheckoutSession({
      name: `Donation for ${campaign.patient?.name || campaign.diagnosis || "medical campaign"}`,
      successUrl,
      cancelUrl,
      financialAccountId: campaign.financial_account.id,
      lineItems: [{
        type: 'custom',
        name: `Donation for ${campaign.patient?.name || campaign.diagnosis || "medical campaign"}`,
        price: {
          currency: validatedData.currency,
          value: amountMinor,
        },
        quantity: 1,
        description: `Medical donation for ${campaign.diagnosis}${validatedData.message ? ` - ${validatedData.message}` : ''}`,
        reference,
      }],
      metadata: {
        donationId: donationIdStr,
        campaignId: campaignIdStr,
        campaignSlug: validatedData.campaignSlug,
        isAnonymous: validatedData.isAnonymous.toString(),
        donorName: validatedData.donor?.name || 'Anonymous',
        financialAccountId: campaign.financial_account.id,
      },
      callbackState: reference,
    }, reference); // Use reference as idempotency key

    console.log("checkoutSession", checkoutSession);

    // Update donation with checkout session ID
    await donationService.updateCheckoutSession(donationIdStr, checkoutSession.id);

    return NextResponse.json({
      success: true,
      data: {
        donationId: donationIdStr,
        checkoutUrl: checkoutSession.redirectUrl,
        checkoutSessionId: checkoutSession.id,
        expiresAt: checkoutSession.expiresAt,
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