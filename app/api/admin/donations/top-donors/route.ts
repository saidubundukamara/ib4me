import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get("limit") || "10");

    const topDonors = await donationService.getTopDonors(limit);
    
    return NextResponse.json({
      success: true,
      data: topDonors,
    });
  } catch (error) {
    console.error("Error fetching top donors:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch top donors",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}