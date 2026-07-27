import { NextResponse } from "next/server";
import { partnerService } from "@/services/PartnerService";
import { getAdminFromToken } from "@/lib/admin-auth-token";

export async function GET() {
  try {
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
