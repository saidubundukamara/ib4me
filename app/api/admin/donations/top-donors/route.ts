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