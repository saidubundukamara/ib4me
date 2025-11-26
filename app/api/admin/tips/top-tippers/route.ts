import { NextRequest, NextResponse } from "next/server";
import { tipService } from "@/services";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const topTippers = await tipService.getTopTippers(limit);

    return NextResponse.json({
      success: true,
      data: topTippers,
    });
  } catch (error) {
    console.error("Error fetching top tippers:", error);
    return NextResponse.json(
      { error: "Failed to fetch top tippers" },
      { status: 500 }
    );
  }
}
