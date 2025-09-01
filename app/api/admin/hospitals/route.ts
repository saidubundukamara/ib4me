import { NextRequest, NextResponse } from "next/server";
import { hospitalService } from "@/services/HospitalService";
import { connectDB } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters = {
      search: searchParams.get("search") || undefined,
      verified: searchParams.get("verified") === "true" ? true : 
                searchParams.get("verified") === "false" ? false : "all",
      dateFrom: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined,
      dateTo: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined,
    };

    // Parse pagination and sorting options
    const options = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await hospitalService.listForAdmin(filters, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching hospitals for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, address, contactPhone, contactEmail, notes, verified } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Hospital name is required" },
        { status: 400 }
      );
    }

    const hospital = await hospitalService.create({
      name,
      address,
      contactPhone,
      contactEmail,
      notes,
      verified
    });

    return NextResponse.json({
      success: true,
      data: hospital,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating hospital:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}