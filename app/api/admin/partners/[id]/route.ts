import { NextRequest, NextResponse } from "next/server";
import { partnerService } from "@/services/PartnerService";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { PartnerType, PartnerStatus } from "@/models/Partner";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
    }

    const partner = await partnerService.getById(id);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const logoUrl = await getLogoUrl(partner.logoAssetId);

    return NextResponse.json({
      success: true,
      data: {
        _id: partner._id,
        name: partner.name,
        logoUrl,
        website: partner.website,
        partnerType: partner.partnerType,
        status: partner.status,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching partner details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

    const contentType = request.headers.get("content-type") || "";

    let name: string | undefined;
    let website: string | undefined;
    let partnerType: PartnerType | undefined;
    let status: PartnerStatus | undefined;
    let logoFile: File | null = null;
    let removeLogo = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = (form.get("name") as string) || undefined;
      website = form.has("website") ? (form.get("website") as string) : undefined;
      partnerType = (form.get("partnerType") as PartnerType) || undefined;
      status = (form.get("status") as PartnerStatus) || undefined;
      logoFile = form.get("logo") as File | null;
      removeLogo = form.get("removeLogo") === "true";
    } else {
      const body = await request.json();
      name = body.name;
      website = body.website;
      partnerType = body.partnerType;
      status = body.status;
      removeLogo = body.removeLogo === true;
    }

    const updatedPartner = await partnerService.update(id, {
      name,
      website,
      partnerType,
      status,
    });

    if (!updatedPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    if (removeLogo && !logoFile) {
      try {
        await partnerService.removeLogo(id);
      } catch {
        // Ignore if no logo to remove
      }
    }

    if (logoFile && logoFile.size > 0) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      await partnerService.uploadLogo(id, logoBuffer);
    }

    const finalPartner = await partnerService.getById(id);
    const logoUrl = await getLogoUrl(finalPartner?.logoAssetId);

    return NextResponse.json({
      success: true,
      data: {
        _id: finalPartner?._id,
        name: finalPartner?.name,
        logoUrl,
        website: finalPartner?.website,
        partnerType: finalPartner?.partnerType,
        status: finalPartner?.status,
        createdAt: finalPartner?.createdAt,
        updatedAt: finalPartner?.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating partner:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid partner ID" }, { status: 400 });
    }

    const deleted = await partnerService.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete partner" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting partner:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
