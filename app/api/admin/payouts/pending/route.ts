import { NextResponse } from "next/server";
import { payoutService } from "@/services";

export async function GET() {
  try {
    const pendingApprovals = await payoutService.getPendingApprovals();

    return NextResponse.json({
      success: true,
      data: pendingApprovals,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pending approvals",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
