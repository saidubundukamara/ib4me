import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth-config";
import { testimonialService } from "@/services/TestimonialService";

export async function GET() {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const testimonials = await testimonialService.getUserTestimonials(userId);

    return NextResponse.json({
      success: true,
      testimonials: testimonials.map((t) => ({
        id: String(t._id),
        authorName: t.authorName,
        authorRole: t.authorRole,
        quote: t.quote,
        status: t.status,
        rejectionReason: t.rejectionReason,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch user testimonials:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { authorRole, quote } = body;

    const testimonial = await testimonialService.createTestimonial(userId, {
      authorRole,
      quote,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Testimonial submitted successfully",
        testimonial: {
          id: String(testimonial._id),
          authorName: testimonial.authorName,
          authorRole: testimonial.authorRole,
          quote: testimonial.quote,
          status: testimonial.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create testimonial:", error);
    const message = error instanceof Error ? error.message : "Failed to create testimonial";
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}
