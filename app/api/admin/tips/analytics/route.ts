import { NextRequest, NextResponse } from "next/server";
import { tipService } from "@/services";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const analytics = await tipService.getAnalytics(dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching tip analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch tip analytics" },
      { status: 500 }
    );
  }
}
