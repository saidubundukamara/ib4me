import { NextRequest, NextResponse } from "next/server";
import { categoryService } from "@/services/CategoryService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const isActiveParam = searchParams.get("isActive");
    const filters = {
      search: searchParams.get("search") || undefined,
      isActive:
        isActiveParam === "true"
          ? true
          : isActiveParam === "false"
            ? false
            : isActiveParam === "all"
              ? ("all" as const)
              : undefined,
      dateFrom: searchParams.get("dateFrom")
        ? new Date(searchParams.get("dateFrom")!)
        : undefined,
      dateTo: searchParams.get("dateTo")
        ? new Date(searchParams.get("dateTo")!)
        : undefined,
    };

    const options = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "displayOrder",
      sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
    };

    const result = await categoryService.listForAdmin(filters, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching categories for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await categoryService.create({
      name,
      description,
      icon,
      displayOrder,
      isActive,
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
