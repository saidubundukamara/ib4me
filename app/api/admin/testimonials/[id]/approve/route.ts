import { NextRequest, NextResponse } from "next/server";
import { testimonialService } from "@/services/TestimonialService";
import { validateAdminAuth, extractAuditContext, AdminAuthError } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/testimonials/[id]/approve - Approve testimonial
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const adminAuth = await validateAdminAuth();
    const auditContext = extractAuditContext(request);

    const { id } = await params;

    const testimonial = await testimonialService.approveTestimonial(
      id,
      adminAuth.adminId.toString(),
      auditContext
    );

    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: "Failed to approve testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial approved successfully",
      status: testimonial.status,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/admin/testimonials/[id]/approve error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to approve testimonial",
      },
      { status: 400 }
    );
  }
}
