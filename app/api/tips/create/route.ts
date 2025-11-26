import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { monimeService, toMinorUnits, MonimeApiError } from "@/lib/monime";
import { tipService, settingService } from "@/services";

const createTipSchema = z.object({
  amount: z.number().min(1).max(1000000), // Major units
  currency: z.string().default("SLE"),
  tipper: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  isAnonymous: z.boolean().default(false),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createTipSchema.parse(body);

    // Get platform financial account from settings
    const platformAccount = await tipService.getPlatformFinancialAccount();
    if (!platformAccount?.id) {
      return NextResponse.json(
        {
          error:
            "Platform tipping is not configured. Please contact support.",
        },
        { status: 400 }
      );
    }

    // Check if tipping is enabled
    const tippingSettings = await settingService.getTippingSettings();
    if (!tippingSettings?.enabled) {
      return NextResponse.json(
        { error: "Platform tipping is currently disabled." },
        { status: 400 }
      );
    }

    // Convert amount to minor units
    const amountMinor = toMinorUnits(
      validatedData.amount,
      validatedData.currency
    );

    // Validate amount against min/max
    if (amountMinor < tippingSettings.minAmountMinor) {
      return NextResponse.json(
        {
          error: `Minimum tip amount is ${tippingSettings.minAmountMinor / 100} ${validatedData.currency}`,
        },
        { status: 400 }
      );
    }
    if (amountMinor > tippingSettings.maxAmountMinor) {
      return NextResponse.json(
        {
          error: `Maximum tip amount is ${tippingSettings.maxAmountMinor / 100} ${validatedData.currency}`,
        },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending tip record
    const tip = await tipService.createPending({
      tipperId: null,
      tipperSnapshot: validatedData.tipper || null,
      isAnonymous: validatedData.isAnonymous,
      message: validatedData.message || null,
      amountMinor,
      currency: validatedData.currency,
      provider: {
        name: "MONIME",
        paymentId: undefined,
        checkoutSessionId: undefined,
      },
      idempotencyKey: reference,
    });

    // Prepare URLs
    const baseUrl =
      process.env.APP_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const tipIdStr = String(tip._id);
    const successUrl = `${baseUrl}/tip/success?tip_id=${tipIdStr}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/tip/cancel?tip_id=${tipIdStr}`;

    // Create Monime checkout session
    const checkoutSession = await monimeService.createCheckoutSession(
      {
        name: "Tip for IB4ME Platform",
        successUrl,
        cancelUrl,
        financialAccountId: platformAccount.id,
        lineItems: [
          {
            type: "custom",
            name: "Platform Support Tip",
            price: {
              currency: validatedData.currency,
              value: amountMinor,
            },
            quantity: 1,
            description:
              validatedData.message || "Thank you for supporting IB4ME!",
            reference,
          },
        ],
        metadata: {
          tipId: tipIdStr,
          type: "platform_tip",
          isAnonymous: validatedData.isAnonymous.toString(),
          tipperName: validatedData.tipper?.name || "Anonymous",
        },
        callbackState: reference,
      },
      reference
    );

    // Update tip with checkout session ID
    await tipService.updateCheckoutSession(tipIdStr, checkoutSession.id);

    return NextResponse.json({
      success: true,
      data: {
        tipId: tipIdStr,
        checkoutUrl: checkoutSession.redirectUrl,
        checkoutSessionId: checkoutSession.id,
        expiresAt: checkoutSession.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating tip:", error);

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
          code: error.code,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
