import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import { userRepository } from "@/repositories";
import DonateClient from "./DonateClient";

type PageParams = {
  params: { slug: string };
};

export default async function CampaignDonatePage({ params }: PageParams) {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);
  if (!campaign) return notFound();

  const currency = campaign.goal?.currency || "SLE";
  const raisedMinor = campaign.totals?.raisedMinor ?? 0;
  const goalMinor = campaign.goal?.amountMinor ?? 0;
  const amountRaised = Math.max(0, Math.floor(raisedMinor) / 100);
  const goalAmount = Math.max(0, Math.floor(goalMinor) / 100);
  const progress = goalAmount > 0 ? Math.min(100, Math.round((amountRaised / goalAmount) * 100)) : 0;
  const title = campaign.patient?.name || campaign.diagnosis || campaign.slug;

  const organizer = campaign.ownerId ? await userRepository.findById(String(campaign.ownerId)) : null;

  // Collect asset IDs: patient photo (priority) and first document image (fallback)
  const assetIds: mongoose.Types.ObjectId[] = [];
  if (campaign.patient?.photoAssetId) {
    assetIds.push(campaign.patient.photoAssetId as mongoose.Types.ObjectId);
  }
  const firstImageDoc = (campaign.documents || []).find((d) => d.type?.startsWith("image/"));
  if (firstImageDoc?.assetId) {
    assetIds.push(firstImageDoc.assetId as unknown as mongoose.Types.ObjectId);
  }

  let imageUrl = "/assets/Hero.png";
  if (assetIds.length > 0) {
    const assets = await mediaAssetService.listByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [String(a._id), a]));

    // Try patient photo first
    let resolvedUrl: string | null = null;
    if (campaign.patient?.photoAssetId) {
      const photoAsset = assetMap.get(String(campaign.patient.photoAssetId));
      if (photoAsset) {
        const key = photoAsset.storage?.key;
        resolvedUrl = key
          ? CloudinaryService.generateTransformationUrl(key, {
              width: 256,
              crop: "fill",
              gravity: "auto",
              aspect_ratio: "1:1",
              fetch_format: "auto",
              quality: "auto",
            })
          : photoAsset.url || null;
      }
    }

    // Fallback to first document image
    if (!resolvedUrl && firstImageDoc?.assetId) {
      const docAsset = assetMap.get(String(firstImageDoc.assetId));
      if (docAsset) {
        const key = docAsset.storage?.key;
        resolvedUrl = key
          ? CloudinaryService.generateTransformationUrl(key, {
              width: 256,
              crop: "fill",
              gravity: "auto",
              aspect_ratio: "1:1",
              fetch_format: "auto",
              quality: "auto",
            })
          : docAsset.url || null;
      }
    }

    if (resolvedUrl) {
      imageUrl = resolvedUrl;
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <DonateClient
        slug={slug}
        currency={currency}
        title={title}
        organizerName={organizer?.name ?? null}
        progressPercent={progress}
        amountRaised={amountRaised}
        goalAmount={goalAmount}
        imageUrl={imageUrl}
      />
    </main>
  );
}


