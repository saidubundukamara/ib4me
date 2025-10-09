import { NextRequest, NextResponse } from "next/server";
import { settingService } from "../../../../services/SettingService";
import {
  validateAdminAuth,
  createAuthErrorResponse,
  AdminAuthError,
} from "../../../../lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let settings;

    switch (category) {
      case "website":
        settings = await settingService.getWebsiteSettings();
        break;
      case "payment":
        settings = await settingService.getPaymentSettings();
        break;
      case "features":
        settings = await settingService.getFeatureSettings();
        break;
      case "contact":
        settings = await settingService.getContactSettings();
        break;
      case "social":
        settings = await settingService.getSocialSettings();
        break;
      case "seo":
        settings = await settingService.getSeoSettings();
        break;
      default:
        // Return all categories when no specific category is requested
        const [website, payment, features, contact, social, seo] =
          await Promise.all([
            settingService.getWebsiteSettings(),
            settingService.getPaymentSettings(),
            settingService.getFeatureSettings(),
            settingService.getContactSettings(),
            settingService.getSocialSettings(),
            settingService.getSeoSettings(),
          ]);

        return NextResponse.json({
          success: true,
          settings: { website, payment, features, contact, social, seo },
        });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate admin authentication
    const adminContext = await validateAdminAuth();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    let updatedSettings;

    switch (category) {
      case "website":
        updatedSettings = await settingService.updateWebsiteSettings(
          body,
          adminContext.adminId.toString()
        );
        break;
      case "payment":
        updatedSettings = await settingService.updatePaymentSettings(
          body,
          adminContext.adminId.toString()
        );
        break;
      case "features":
        updatedSettings = await settingService.updateFeatureSettings(
          body,
          adminContext.adminId.toString()
        );
        break;
      case "contact":
        updatedSettings = await settingService.updateContactSettings(
          body,
          adminContext.adminId.toString()
        );
        break;
      case "social":
        updatedSettings = await settingService.updateSocialSettings(
          body,
          adminContext.adminId.toString()
        );
        break;
      case "seo":
        updatedSettings = await settingService.updateSeoSettings(
          body,
          adminContext.adminId.toString()
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } settings updated successfully`,
      settings: updatedSettings,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const authError = createAuthErrorResponse(error);
      return NextResponse.json(
        { error: authError.error },
        { status: authError.statusCode }
      );
    }

    console.error("Settings update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 500 }
    );
  }
}
