import { NextResponse } from "next/server";
import { settingService, tipService } from "@/services";

export async function GET() {
  try {
    const tippingSettings = await settingService.getTippingSettings();
    const platformAccount = await tipService.getPlatformFinancialAccount();

    // Check if tipping is properly configured
    const isConfigured = !!(platformAccount?.id && platformAccount?.uvan);
    const isEnabled = isConfigured && (tippingSettings?.enabled ?? false);

    return NextResponse.json({
      enabled: isEnabled,
      suggestedAmounts: tippingSettings?.suggestedAmounts || [5000, 10000, 25000, 50000],
      minAmountMinor: tippingSettings?.minAmountMinor || 100,
      maxAmountMinor: tippingSettings?.maxAmountMinor || 10000000,
    });
  } catch (error) {
    console.error("Error fetching tipping settings:", error);
    return NextResponse.json(
      { error: "Failed to load tipping settings" },
      { status: 500 }
    );
  }
}
