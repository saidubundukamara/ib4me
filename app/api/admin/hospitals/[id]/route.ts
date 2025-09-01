import { NextRequest, NextResponse } from "next/server";
import { hospitalService } from "@/services/HospitalService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

type RouteParams = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid hospital ID" }, { status: 400 });
    }

    const hospital = await hospitalService.getById(id);

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error("Error fetching hospital details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid hospital ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, address, contactPhone, contactEmail, notes, verified } = body;

    const updatedHospital = await hospitalService.update(id, {
      name,
      address,
      contactPhone,
      contactEmail,
      notes,
      verified
    });

    if (!updatedHospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedHospital,
    });

  } catch (error) {
    console.error("Error updating hospital:", error);
    
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid hospital ID" }, { status: 400 });
    }

    const deleted = await hospitalService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete hospital" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Hospital deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting hospital:", error);
    
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