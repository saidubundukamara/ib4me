import { NextResponse } from "next/server";
import { categoryService } from "@/services/CategoryService";

export async function GET() {
  try {
    const categories = await categoryService.findActive();

    return NextResponse.json({
      success: true,
      data: categories.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        displayOrder: c.displayOrder,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
