import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
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
  return NextResponse.json(
    items.map((c) => ({
      id: String(c._id),
      slug: c.slug,
      status: c.status,
      urgency: c.urgency,
      goal: c.goal,
      createdAt: c.createdAt,
    })),
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

  const diagnosis = (form.get("diagnosis") as string | null) || undefined;
  const typeOfEmergency =
    (form.get("typeOfEmergency") as string | null) || undefined;
  const urgency =
    (form.get("urgency") as "low" | "medium" | "high" | null) || "medium";
  const patientName = (form.get("patient.name") as string | null) || "";
  const patientAgeRaw = (form.get("patient.age") as string | null) || "";
  const hospitalName = (form.get("hospital.name") as string | null) || "";
  const goalCurrency = (form.get("goal.currency") as string | null) || "SLE";
  const goalAmountMinorRaw =
    (form.get("goal.amountMinor") as string | null) || "0";
  const story = (form.get("story") as string | null) || "";

  if (!patientName.trim()) {
    return NextResponse.json(
      { error: "patient.name is required" },
      { status: 400 }
    );
  }

  await connectDB();
  const ownerId = new mongoose.Types.ObjectId(session.user.id);
  const slug = await ensureUniqueSlug(rawSlug);

  const goalAmountMinor = Math.max(
    0,
    Number.parseInt(goalAmountMinorRaw, 10) || 0
  );
  const patientAge = patientAgeRaw
    ? Number.parseInt(patientAgeRaw, 10)
    : undefined;

  try {
    // Create campaign using service (includes financial account creation)
    const created = await campaignService.createCampaign({
      ownerId,
      slug,
      diagnosis: diagnosis || undefined,
      typeOfEmergency: typeOfEmergency || undefined,
      urgency,
      patient: {
        name: patientName,
        age: Number.isFinite(patientAge as number) ? patientAge : undefined,
      },
      hospital: { name: hospitalName || undefined },
      goal: { currency: goalCurrency || "SLE", amountMinor: goalAmountMinor },
      story,
    });

    const files = form.getAll("documents").filter(Boolean) as unknown as File[];
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

    return NextResponse.json(
      { id: String(created._id), slug: created.slug },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }

}

