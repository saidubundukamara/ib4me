import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import CampaignModel from "@/models/Campaign";
import MediaAssetModel from "@/models/MediaAsset";
import CloudinaryService from "@/lib/cloudinary";
import { campaignService } from "@/services/CampaignService";

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  await connectDB();
  const existing = await CampaignModel.findOne({ slug: baseSlug });
  if (!existing) return baseSlug;
  let counter = 2;
  while (true) {
    const attempt = `${baseSlug}-${counter}`;
     
    const hit = await CampaignModel.findOne({ slug: attempt });
    if (!hit) return attempt;
    counter += 1;
  }
}

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);
  const items = await CampaignModel.find({ ownerId })
    .sort({ createdAt: -1 })
    .lean();

  // Collect all asset IDs (beneficiary photos and first document images) for batch fetch
  const assetIds: mongoose.Types.ObjectId[] = [];
  const campaignToBeneficiaryPhotoId = new Map<string, string>();
  const campaignToFirstDocImageId = new Map<string, string>();

  for (const c of items) {
    const campaignId = String(c._id);

    // Beneficiary photo takes priority
    if (c.beneficiary?.photoAssetId) {
      assetIds.push(c.beneficiary.photoAssetId as mongoose.Types.ObjectId);
      campaignToBeneficiaryPhotoId.set(campaignId, String(c.beneficiary.photoAssetId));
    }

    // First document image as fallback
    const firstImageDoc = (c.documents || []).find(
      (d: { type?: string }) => d.type?.startsWith("image/")
    );
    if (firstImageDoc?.assetId) {
      assetIds.push(firstImageDoc.assetId as mongoose.Types.ObjectId);
      campaignToFirstDocImageId.set(campaignId, String(firstImageDoc.assetId));
    }
  }

  // Batch fetch all assets
  const assets = assetIds.length > 0
    ? await MediaAssetModel.find({ _id: { $in: assetIds } }).lean()
    : [];

  // Create URL map
  const assetIdToUrl = new Map<string, string>();
  for (const asset of assets) {
    const key = asset.storage?.key;
    const url = key
      ? CloudinaryService.generateTransformationUrl(key, {
          width: 800,
          crop: "fill",
          gravity: "auto",
          aspect_ratio: "16:9",
          fetch_format: "auto",
          quality: "auto",
        })
      : asset.url || "";
    assetIdToUrl.set(String(asset._id), url);
  }

  return NextResponse.json(
    items.map((c) => {
      const campaignId = String(c._id);
      // Priority: beneficiary photo > document image > null
      const beneficiaryPhotoId = campaignToBeneficiaryPhotoId.get(campaignId);
      const docImageId = campaignToFirstDocImageId.get(campaignId);
      const imageUrl = beneficiaryPhotoId
        ? assetIdToUrl.get(beneficiaryPhotoId)
        : docImageId
          ? assetIdToUrl.get(docImageId)
          : null;

      return {
        id: campaignId,
        slug: c.slug,
        status: c.status,
        urgency: c.urgency,
        goal: c.goal,
        createdAt: c.createdAt,
        totals: c.totals,
        beneficiary: c.beneficiary,
        story: c.story,
        imageUrl,
      };
    }),
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const rawSlug = String(form.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!rawSlug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const details = (form.get("details") as string | null) || undefined;
  const campaignType =
    (form.get("campaignType") as string | null) || undefined;
  const urgency =
    (form.get("urgency") as "low" | "medium" | "high" | null) || "medium";
  const category = (form.get("category") as string | null) || undefined;
  const beneficiaryName = (form.get("beneficiary.name") as string | null) || "";
  const beneficiaryAgeRaw = (form.get("beneficiary.age") as string | null) || "";
  const institutionName = (form.get("institution.name") as string | null) || "";
  const goalCurrency = (form.get("goal.currency") as string | null) || "SLE";
  const goalAmountMinorRaw =
    (form.get("goal.amountMinor") as string | null) || "0";
  const story = (form.get("story") as string | null) || "";

  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);
  const slug = await ensureUniqueSlug(rawSlug);

  const goalAmountMinor = Math.max(
    0,
    Number.parseInt(goalAmountMinorRaw, 10) || 0
  );
  const beneficiaryAge = beneficiaryAgeRaw
    ? Number.parseInt(beneficiaryAgeRaw, 10)
    : undefined;

  try {
    // Create campaign using service (includes financial account creation)
    const result = await campaignService.createCampaign({
      ownerId,
      slug,
      details: details || undefined,
      campaignType: campaignType || undefined,
      urgency,
      category: category || undefined,
      beneficiary: beneficiaryName.trim() ? {
        name: beneficiaryName,
        age: Number.isFinite(beneficiaryAge as number) ? beneficiaryAge : undefined,
      } : undefined,
      institution: institutionName.trim() ? {
        name: institutionName,
      } : undefined,
      goal: { currency: goalCurrency || "SLE", amountMinor: goalAmountMinor },
      story,
    });

    const created = result.campaign;

    // Extract document files - form sends them as documents[0], documents[1], etc.
    const files: File[] = [];
    for (const [key, value] of form.entries()) {
      if (key.startsWith("documents[") && value instanceof File) {
        files.push(value);
      }
    }
    const uploadedAssets: { type: string; assetId: mongoose.Types.ObjectId }[] =
      [];
    for (const f of files) {
       
      const buffer = Buffer.from(await f.arrayBuffer());
       
      const result = await CloudinaryService.uploadBuffer(buffer, {
        folder: `campaigns/${session.user.id}`,
        resource_type: "auto",
      });
       
      const asset = await MediaAssetModel.create({
        ownerId,
        campaignId: created._id,
        type: f.type || "file",
        storage: { provider: "cloudinary", key: result.public_id },
        url: result.secure_url,
        size: (f as unknown as { size?: number }).size ?? result.bytes,
      });
      uploadedAssets.push({ type: f.type || "file", assetId: asset._id });
    }

    if (uploadedAssets.length > 0) {
      await CampaignModel.findByIdAndUpdate(created._id, {
        $push: { documents: { $each: uploadedAssets } },
      });
    }

    // Handle beneficiary photo upload
    const beneficiaryPhoto = form.get("beneficiaryPhoto") as File | null;
    if (beneficiaryPhoto && beneficiaryPhoto.size > 0) {
      const photoBuffer = Buffer.from(await beneficiaryPhoto.arrayBuffer());
      const photoResult = await CloudinaryService.uploadBuffer(photoBuffer, {
        folder: `campaigns/${session.user.id}/beneficiary`,
        resource_type: "image",
      });

      const photoAsset = await MediaAssetModel.create({
        ownerId,
        campaignId: created._id,
        type: beneficiaryPhoto.type || "image",
        storage: { provider: "cloudinary", key: photoResult.public_id },
        url: photoResult.secure_url,
        size: beneficiaryPhoto.size ?? photoResult.bytes,
      });

      await CampaignModel.findByIdAndUpdate(created._id, {
        "beneficiary.photoAssetId": photoAsset._id,
      });
    }

    return NextResponse.json(
      {
        id: String(created._id),
        slug: created.slug,
        ownerVerification: result.ownerVerification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create campaign:', error);

    // Check for campaign limit exceeded error
    const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
    if (errorMessage.includes("maximum of") && errorMessage.includes("active campaigns")) {
      return NextResponse.json(
        {
          error: errorMessage,
          code: "CAMPAIGN_LIMIT_EXCEEDED"
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }

}

