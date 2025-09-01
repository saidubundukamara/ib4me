import { NextResponse } from "next/server";
import { hospitalService } from "@/services/HospitalService";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();

    const analytics = await hospitalService.getAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching hospital analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}