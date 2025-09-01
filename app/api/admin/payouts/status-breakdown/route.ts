import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const statusBreakdown = await payoutService.getPayoutsByStatus();
    
    return NextResponse.json({
      success: true,
      data: statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching status breakdown:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch status breakdown",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}