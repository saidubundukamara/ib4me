import { NextRequest, NextResponse } from "next/server";
import { testimonialService } from "@/services/TestimonialService";
import { validateAdminAuth, extractAuditContext, AdminAuthError } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/testimonials/[id]/reject - Reject testimonial
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const adminAuth = await validateAdminAuth();
    const auditContext = extractAuditContext(request);

    const { id } = await params;

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const testimonial = await testimonialService.rejectTestimonial(
      id,
      adminAuth.adminId.toString(),
      reason,
      auditContext
    );

    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: "Failed to reject testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial rejected",
      status: testimonial.status,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/admin/testimonials/[id]/reject error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to reject testimonial",
      },
      { status: 400 }
    );
  }
}
