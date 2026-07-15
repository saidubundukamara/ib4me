import { NextResponse } from "next/server";
import { payoutService } from "@/services";
import { getAdminFromToken } from "@/lib/admin-auth-token";

export async function GET() {
  try {
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const statusBreakdown = await payoutService.getPayoutsByStatus();

    return NextResponse.json({
      success: true,
      data: statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching status breakdown:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch status breakdown",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
