import { NextResponse } from "next/server";
import { categoryService } from "@/services/CategoryService";
import { connectDB } from "@/lib/db";

export async function POST() {
  try {
    await connectDB();

    const result = await categoryService.seedInitialCategories();

    return NextResponse.json({
      success: true,
      message: `Seeded categories: ${result.created} created, ${result.skipped} already existed`,
      data: result,
    });
  } catch (error) {
    console.error("Error seeding categories:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
