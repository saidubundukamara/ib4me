import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { testimonialService } from "@/services/TestimonialService";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { authorRole, quote } = body;

    const testimonial = await testimonialService.updateTestimonial(userId, id, {
      authorRole,
      quote,
    });

    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: "Failed to update testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial updated successfully",
      testimonial: {
        id: String(testimonial._id),
        authorName: testimonial.authorName,
        authorRole: testimonial.authorRole,
        quote: testimonial.quote,
        status: testimonial.status,
      },
    });
  } catch (error) {
    console.error("Failed to update testimonial:", error);
    const message = error instanceof Error ? error.message : "Failed to update testimonial";
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session: Session | null = await getServerSession(authConfig);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await testimonialService.deleteTestimonial(userId, id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Failed to delete testimonial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete testimonial:", error);
    const message = error instanceof Error ? error.message : "Failed to delete testimonial";
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}
