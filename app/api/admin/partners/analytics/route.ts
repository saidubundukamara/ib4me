import { NextResponse } from "next/server";
import { partnerService } from "@/services/PartnerService";

export async function GET() {
  try {
    const analytics = await partnerService.getAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching partner analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
