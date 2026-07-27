import { NextResponse } from "next/server";
import { tipService } from "@/services";

/**
 * GET /api/tips/settings — public.
 *
 * Tells a client whether tipping is available and on what terms. Used by the /tip page
 * itself; server-rendered surfaces (the thank-you CTA, the nav and footer links) call
 * `tipService.getPublicTippingState()` directly instead of paying for a round trip.
 *
 * The gate lives in the service, not here, so every surface agrees on what "tipping is on"
 * means — notably that it requires a configured tip account, not just the toggle.
 */
export async function GET() {
  try {
    const state = await tipService.getPublicTippingState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Error fetching tipping settings:", error);
    return NextResponse.json(
      { error: "Failed to load tipping settings" },
      { status: 500 }
    );
  }
}
