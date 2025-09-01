import { NextRequest, NextResponse } from "next/server";
import { dashboardService } from "../../../../../services/DashboardService";
import { validateAdminAuth, createAuthErrorResponse, AdminAuthError } from "../../../../../lib/admin-auth";
import { connectDB } from "../../../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Validate admin authentication
    await validateAdminAuth(request);

    // Get comprehensive dashboard statistics
    const data = await dashboardService.getDashboardStats();

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    if (error instanceof AdminAuthError) {
      const authError = createAuthErrorResponse(error);
      return NextResponse.json({ error: authError.error }, { status: authError.statusCode });
    }
    
    console.error("Dashboard stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}