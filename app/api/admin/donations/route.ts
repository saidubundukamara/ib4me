import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/services";
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
    const provider = searchParams.get("provider") || "";
    const campaignId = searchParams.get("campaignId");
    const donorId = searchParams.get("donorId");
    const isAnonymous = searchParams.get("isAnonymous");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const amountMin = searchParams.get("amountMin");
    const amountMax = searchParams.get("amountMax");
    const search = searchParams.get("search") || "";

    // Build filters
    const filters: Record<string, unknown> = {};
    
    if (status !== "all") {
      filters.status = status;
    }
    
    if (provider) {
      filters.provider = provider;
    }
    
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
      filters.campaignId = new mongoose.Types.ObjectId(campaignId);
    }
    
    if (donorId && mongoose.Types.ObjectId.isValid(donorId)) {
      filters.donorId = new mongoose.Types.ObjectId(donorId);
    }
    
    if (isAnonymous !== null && isAnonymous !== undefined) {
      filters.isAnonymous = isAnonymous === "true";
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

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await donationService.listForAdmin(filters, options);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch donations",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}