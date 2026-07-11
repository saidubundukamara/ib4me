import { NextRequest, NextResponse } from "next/server";
import { tipService } from "@/services";
import { getAdminFromToken } from "@/lib/admin-auth-token";

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || undefined;

    const result = await tipService.listForAdmin(
      { status: status as "pending" | "succeeded" | "failed" | "refunded" | undefined },
      { page, limit }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching tips:", error);
    return NextResponse.json(
      { error: "Failed to fetch tips" },
      { status: 500 }
    );
  }
}
