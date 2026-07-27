import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
import { getAdminFromToken } from "@/lib/admin-auth-token";

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    const analytics = await donationService.getAnalytics(dateFromObj, dateToObj);
    
    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching donation analytics:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch donation analytics",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}