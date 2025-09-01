import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    const providerBreakdown = await donationService.getProviderBreakdown(dateFromObj, dateToObj);
    
    return NextResponse.json({
      success: true,
      data: providerBreakdown,
    });
  } catch (error) {
    console.error("Error fetching provider breakdown:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch provider breakdown",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}