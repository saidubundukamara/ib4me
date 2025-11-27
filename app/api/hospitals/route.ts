import { NextResponse } from "next/server";
import { hospitalService } from "@/services/HospitalService";

export async function GET() {
  try {
    const hospitals = await hospitalService.findVerified();

    return NextResponse.json({
      success: true,
      data: hospitals.map((h) => ({
        _id: h._id,
        name: h.name,
        address: h.address,
      })),
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
