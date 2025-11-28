import { NextRequest, NextResponse } from "next/server";
import { partnerService } from "@/services/PartnerService";
import { PartnerType, PartnerStatus } from "@/models/Partner";
import MediaAsset from "@/models/MediaAsset";
import CloudinaryService from "@/lib/cloudinary";

async function getLogoUrl(
  logoAssetId: unknown
): Promise<string | null> {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const partnerTypeParam = searchParams.get("partnerType");
    const statusParam = searchParams.get("status");

    const filters = {
      search: searchParams.get("search") || undefined,
      partnerType:
        partnerTypeParam === "all"
          ? ("all" as const)
          : (partnerTypeParam as PartnerType | undefined),
      status:
        statusParam === "all"
          ? ("all" as const)
          : (statusParam as PartnerStatus | undefined),
      dateFrom: searchParams.get("dateFrom")
        ? new Date(searchParams.get("dateFrom")!)
        : undefined,
      dateTo: searchParams.get("dateTo")
        ? new Date(searchParams.get("dateTo")!)
        : undefined,
    };

    const options = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    };

    const result = await partnerService.listForAdmin(filters, options);

    const partnersWithLogos = await Promise.all(
      result.partners.map(async (partner) => {
        const logoUrl = await getLogoUrl(partner.logoAssetId);
        return {
          _id: partner._id,
          name: partner.name,
          logoUrl,
          website: partner.website,
          partnerType: partner.partnerType,
          status: partner.status,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        partners: partnersWithLogos,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching partners for admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let name: string;
    let website: string | undefined;
    let partnerType: PartnerType;
    let status: PartnerStatus | undefined;
    let logoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = form.get("name") as string;
      website = (form.get("website") as string) || undefined;
      partnerType = form.get("partnerType") as PartnerType;
      status = (form.get("status") as PartnerStatus) || undefined;
      logoFile = form.get("logo") as File | null;
    } else {
      const body = await request.json();
      name = body.name;
      website = body.website;
      partnerType = body.partnerType;
      status = body.status;
    }

    if (!name) {
      return NextResponse.json(
        { error: "Partner name is required" },
        { status: 400 }
      );
    }

    const partner = await partnerService.create({
      name,
      website,
      partnerType,
      status,
    });

    const partnerId = (partner._id as { toString(): string }).toString();

    if (logoFile && logoFile.size > 0) {
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      await partnerService.uploadLogo(partnerId, logoBuffer);
    }

    const updatedPartner = await partnerService.getById(partnerId);
    const logoUrl = await getLogoUrl(updatedPartner?.logoAssetId);

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: updatedPartner?._id,
          name: updatedPartner?.name,
          logoUrl,
          website: updatedPartner?.website,
          partnerType: updatedPartner?.partnerType,
          status: updatedPartner?.status,
          createdAt: updatedPartner?.createdAt,
          updatedAt: updatedPartner?.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating partner:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
