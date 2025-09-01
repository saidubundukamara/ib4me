import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    const revenueReport = await donationService.getRevenueReport(dateFromObj, dateToObj);
    
    return NextResponse.json({
      success: true,
      data: revenueReport,
    });
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch revenue report",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}