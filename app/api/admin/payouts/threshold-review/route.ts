import { NextRequest, NextResponse } from "next/server";
import { payoutService } from "@/services";
import { z } from "zod";

const thresholdReviewQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  sort: z.enum(["createdAt", "amountMinor", "updatedAt"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sort: searchParams.get("sort") || undefined,
      order: searchParams.get("order") || undefined,
    };

    const { page, limit, sort, order } = thresholdReviewQuerySchema.parse(queryParams);

    // Get payouts that are in threshold review status
    const result = await payoutService.listForAdmin(
      {
        status: "threshold_review"
      },
      {
        page,
        limit,
        sortBy: sort,
        sortOrder: order
      }
    );

    return NextResponse.json({
      success: true,
      data: result.payouts,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1
      },
      message: "Payouts in threshold review retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching threshold review payouts:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to fetch payouts",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}