import { NextRequest, NextResponse } from "next/server";
import { partnerService } from "@/services/PartnerService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import MediaAsset from "@/models/MediaAsset";
import CloudinaryService from "@/lib/cloudinary";

async function getLogoUrl(logoAssetId: unknown): Promise<string | null> {
  if (!logoAssetId) return null;

  const asset = await MediaAsset.findById(logoAssetId);
  if (!asset) return null;

  if (asset.storage?.key) {
    return CloudinaryService.generateTransformationUrl(asset.storage.key, {
      width: 200,
      crop: "fit",
      fetch_format: "auto",
      quality: "auto",
    });
  }

  return asset.url || null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
    }

    const updatedPartner = await partnerService.toggleStatus(id);

    if (!updatedPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const logoUrl = await getLogoUrl(updatedPartner.logoAssetId);

    return NextResponse.json({
      success: true,
      data: {
        _id: updatedPartner._id,
        name: updatedPartner.name,
        logoUrl,
        website: updatedPartner.website,
        partnerType: updatedPartner.partnerType,
        status: updatedPartner.status,
        createdAt: updatedPartner.createdAt,
        updatedAt: updatedPartner.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error toggling partner status:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
