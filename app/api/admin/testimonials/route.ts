import { NextRequest, NextResponse } from "next/server";
import { testimonialService } from "@/services/TestimonialService";
import { validateAdminAuth, AdminAuthError } from "@/lib/admin-auth";
import { IUser } from "@/models/User";

// Helper to transform testimonial data for frontend
function transformTestimonial(testimonial: {
  _id?: unknown;
  userId?: unknown;
  authorName?: string;
  authorRole?: string;
  quote?: string;
  status?: string;
  reviewedBy?: unknown;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const user = testimonial.userId as unknown as IUser | null;

  return {
    _id: testimonial._id?.toString() || "",
    userId: user?._id?.toString() || "",
    userName: user?.name || "",
    userEmail: user?.email || "",
    authorName: testimonial.authorName || "",
    authorRole: testimonial.authorRole || "",
    quote: testimonial.quote || "",
    status: testimonial.status || "",
    reviewedAt: testimonial.reviewedAt?.toISOString() || null,
    rejectionReason: testimonial.rejectionReason || null,
    createdAt: testimonial.createdAt?.toISOString() || "",
    updatedAt: testimonial.updatedAt?.toISOString() || "",
  };
}

// GET /api/admin/testimonials - List testimonials with filters
export async function GET(request: NextRequest) {
  try {
    await validateAdminAuth();

    const { searchParams } = new URL(request.url);

    // Check if stats are requested
    if (searchParams.get("stats") === "true") {
      const stats = await testimonialService.getStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    const filters = {
      status: (searchParams.get("status") as "pending" | "approved" | "rejected" | "all") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const options = {
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: Math.min(parseInt(searchParams.get("limit") || "20", 10), 100),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const result = await testimonialService.listForAdmin(filters, options);

    const transformedTestimonials = result.testimonials.map(transformTestimonial);

    return NextResponse.json({
      success: true,
      testimonials: transformedTestimonials,
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/admin/testimonials error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch testimonials",
      },
      { status: 500 }
    );
  }
}
