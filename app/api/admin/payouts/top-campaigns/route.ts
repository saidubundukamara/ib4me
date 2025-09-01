import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get("limit") || "10");

    const topCampaigns = await payoutService.getTopCampaignsByPayouts(limit);
    
    return NextResponse.json({
      success: true,
      data: topCampaigns,
    });
  } catch (error) {
    console.error("Error fetching top campaigns:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch top campaigns",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}