import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import {
  lookupMobileMoneyHolder,
  InvalidMobileNumberError,
  UnregisteredMobileMoneyError,
} from "@/lib/mobileMoney";

/**
 * GET /api/payouts/kyc?msisdn=76123456
 *
 * Real-time mobile-money KYC: returns the registered holder name on the wallet
 * so the user can confirm it before a withdrawal. The withdrawal POST re-runs
 * this check authoritatively — this endpoint only powers the UI confirmation.
 */
export async function GET(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const msisdn = (request.nextUrl.searchParams.get("msisdn") || "").trim();
    if (!/^\d{7,15}$/.test(msisdn)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number (7-15 digits)" },
        { status: 400 }
      );
    }

    const holder = await lookupMobileMoneyHolder(msisdn);
    return NextResponse.json({
      holderName: holder.holderName,
      providerName: holder.providerName,
      providerId: holder.providerId,
      msisdn: holder.msisdn,
    });
  } catch (error) {
    if (
      error instanceof InvalidMobileNumberError ||
      error instanceof UnregisteredMobileMoneyError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("KYC lookup error:", error);
    return NextResponse.json(
      { error: "Unable to verify this number. Please check it and try again." },
      { status: 502 }
    );
  }
}
