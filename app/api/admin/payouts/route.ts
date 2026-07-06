import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    
    // Filters
    const status = searchParams.get("status") || "all";
    const method = searchParams.get("method") || "all";
    const campaignId = searchParams.get("campaignId");
    const requestedBy = searchParams.get("requestedBy");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const amountMin = searchParams.get("amountMin");
    const amountMax = searchParams.get("amountMax");
    const search = searchParams.get("search") || "";
    const requiresApproval = searchParams.get("requiresApproval") === "true";

    // Build filters
    const filters: Record<string, unknown> = {};
    
    if (status !== "all") {
      if (status.includes(",")) {
        filters.status = { $in: status.split(",").map((s: string) => s.trim()) };
      } else {
        filters.status = status;
      }
    }
    
    if (method !== "all") {
      filters.method = method;
    }
    
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      filters.campaignId = new mongoose.Types.ObjectId(campaignId);
    }
    
    if (requestedBy && mongoose.Types.ObjectId.isValid(requestedBy)) {
      filters.requestedBy = new mongoose.Types.ObjectId(requestedBy);
    }
    
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }
    
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }
    
    if (amountMin) {
      filters.amountMin = parseFloat(amountMin);
    }
    
    if (amountMax) {
      filters.amountMax = parseFloat(amountMax);
    }
    
    if (search) {
      filters.search = search;
    }

    if (requiresApproval) {
      filters.requiresApproval = true;
    }

    const options = {
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await payoutService.listForAdmin(filters, options);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch payouts",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}