import { NextResponse } from "next/server";
import { settingService } from "@/services/SettingService";

/**
 * GET /api/settings/cookie-consent
 * Public endpoint - returns cookie consent configuration without tracking IDs
 * Used by the frontend to display the consent banner
 */
export async function GET() {
  try {
    const config = await settingService.getPublicCookieConsentConfig();

    if (!config.enabled) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching cookie consent settings:", error);
    return NextResponse.json({ enabled: false });
  }
}
