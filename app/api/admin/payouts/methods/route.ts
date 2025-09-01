import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    
    const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
    const dateToObj = dateTo ? new Date(dateTo) : undefined;

    const methodBreakdown = await payoutService.getMethodBreakdown(dateFromObj, dateToObj);
    
    return NextResponse.json({
      success: true,
      data: methodBreakdown,
    });
  } catch (error) {
    console.error("Error fetching method breakdown:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch method breakdown",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}