import { NextRequest, NextResponse } from "next/server";
import { hospitalService } from "@/services/HospitalService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid hospital ID" }, { status: 400 });
    }

    const updatedHospital = await hospitalService.toggleVerification(id);

    if (!updatedHospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedHospital,
      message: `Hospital ${updatedHospital.verified ? 'verified' : 'unverified'} successfully`,
    });

  } catch (error) {
    console.error("Error toggling hospital verification:", error);
    
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