import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/services/CampaignService";
import { connectDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters = {
      status: searchParams.get("status") || "all",
      verificationStatus: searchParams.get("verificationStatus") || undefined,
      urgency: searchParams.get("urgency") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined,
      dateTo: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined,
    };

    // Parse pagination and sorting options
    const options = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await campaignService.listForAdmin(filters, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching campaigns for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}