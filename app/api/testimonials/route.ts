import { NextRequest, NextResponse } from "next/server";
import { testimonialService } from "@/services/TestimonialService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const limit = Math.max(1, Math.min(12, Number.parseInt(limitRaw || "6", 10) || 6));

    const testimonials = await testimonialService.getApprovedTestimonials(limit);

    const items = testimonials.map((t) => ({
      id: String(t._id),
      authorName: t.authorName,
      authorRole: t.authorRole,
      quote: t.quote,
    }));

    return NextResponse.json({ success: true, testimonials: items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
