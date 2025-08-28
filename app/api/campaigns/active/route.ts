import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import CampaignModel from "@/models/Campaign";
import MediaAssetModel from "@/models/MediaAsset";
import { CloudinaryService } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get("limit");
  const limit = Math.max(1, Math.min(24, Number.parseInt(limitRaw || "6", 10) || 6));

  const campaigns = await CampaignModel.find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const campaignIdToFirstImageAssetId = new Map<string, string>();
  for (const c of campaigns) {
    const docs = (c.documents as unknown as { type?: string; assetId?: mongoose.Types.ObjectId }[]) || [];
    const firstImage = docs.find((d) => (d.type || "").startsWith("image/"));
    if (firstImage?.assetId) {
      campaignIdToFirstImageAssetId.set(String(c._id), String(firstImage.assetId));
    }
  }

  const uniqueAssetIds = Array.from(new Set(Array.from(campaignIdToFirstImageAssetId.values())));
  const assets = uniqueAssetIds.length
    ? await MediaAssetModel.find({ _id: { $in: uniqueAssetIds.map((id) => new mongoose.Types.ObjectId(id)) } }).lean()
    : [];
  const assetIdToUrl = new Map<string, string>();
  for (const a of assets) {
    const key = (a as unknown as { storage?: { key?: string } }).storage?.key;
    const urlFromKey = key
      ? CloudinaryService.generateTransformationUrl(key, {
          width: 768,
          crop: "fill",
          gravity: "auto",
          aspect_ratio: "16:9",
          fetch_format: "auto",
          quality: "auto",
        })
      : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const direct = (a as any).url as string | undefined;
    assetIdToUrl.set(String((a as unknown as { _id: mongoose.Types.ObjectId })._id), urlFromKey || direct || "");
  }

  const items = campaigns.map((c) => {
    const raisedMinor = (c.totals as unknown as { raisedMinor?: number })?.raisedMinor ?? 0;
    const donationCount = (c.totals as unknown as { donationCount?: number })?.donationCount ?? 0;
    const goalMinor = (c.goal as unknown as { amountMinor?: number })?.amountMinor ?? 0;
    const currency = (c.goal as unknown as { currency?: string })?.currency || "SLE";
    const titleBase = ((c.patient as unknown as { name?: string })?.name || (c.hospital as unknown as { name?: string })?.name || (c as { diagnosis?: string }).diagnosis || c.slug || "").trim();
    const imageAssetId = campaignIdToFirstImageAssetId.get(String(c._id));
    const imageUrl = (imageAssetId && assetIdToUrl.get(imageAssetId)) || "/assets/Hero.png";
    return {
      id: String(c._id),
      slug: c.slug,
      title: titleBase,
      currency,
      amountRaised: Math.max(0, Math.floor(raisedMinor) / 100),
      goalAmount: Math.max(0, Math.floor(goalMinor) / 100),
      donationsCount: donationCount,
      imageUrl,
    };
  });

  return NextResponse.json(items, { status: 200 });
}


