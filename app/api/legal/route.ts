import { NextRequest, NextResponse } from "next/server";
import { settingService } from "../../../services/SettingService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doc = searchParams.get("doc");
    const legal = await settingService.getLegalDocuments();

    if (doc === "privacy") {
      return NextResponse.json({ success: true, data: legal.privacyPolicy });
    }
    if (doc === "terms") {
      return NextResponse.json({ success: true, data: legal.termsOfService });
    }

    return NextResponse.json({ success: true, data: legal });
  } catch (error) {
    console.error("Legal API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch legal documents" },
      { status: 500 }
    );
  }
}
