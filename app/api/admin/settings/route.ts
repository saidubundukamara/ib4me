import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // For now, return default settings since this is just for the login page site name
    // In a real implementation, you'd fetch from the SettingService
    const defaultSettings = {
      website: {
        siteName: "IB4ME",
        description: "Medical Emergency Crowdfunding for Sierra Leone",
        logo: null,
        favicon: null,
        themeColor: "#3b82f6"
      }
    };

    if (category && category in defaultSettings) {
      return NextResponse.json({
        success: true,
        settings: defaultSettings[category as keyof typeof defaultSettings]
      });
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    });

  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}