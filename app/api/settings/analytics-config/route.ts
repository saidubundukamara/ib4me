import { NextResponse } from "next/server";
import { settingService } from "@/services/SettingService";

/**
 * GET /api/settings/analytics-config
 * Returns enabled analytics services with tracking IDs
 * Called by the frontend after user gives consent to load scripts
 */
export async function GET() {
  try {
    const config = await settingService.getAnalyticsConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching analytics config:", error);
    return NextResponse.json({ services: [] });
  }
}
