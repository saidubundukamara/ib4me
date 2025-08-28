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
  const campaign = await campaignService.getBySlug(params.slug);
  if (!campaign) return notFound();

  const currency = campaign.goal?.currency || "SLE";
  const raisedMinor = campaign.totals?.raisedMinor ?? 0;
  const goalMinor = campaign.goal?.amountMinor ?? 0;
  const amountRaised = Math.max(0, Math.floor(raisedMinor) / 100);
  const goalAmount = Math.max(0, Math.floor(goalMinor) / 100);
  const progress = goalAmount > 0 ? Math.min(100, Math.round((amountRaised / goalAmount) * 100)) : 0;
  const title = campaign.patient?.name || campaign.diagnosis || campaign.slug;

  const organizer = campaign.ownerId ? await userRepository.findById(String(campaign.ownerId)) : null;

  let imageUrl = "/assets/Hero.png";
  const firstImageDoc = (campaign.documents || []).find((d) => d.type?.startsWith("image/"));
  if (firstImageDoc?.assetId) {
    const [asset] = await mediaAssetService.listByIds([
      firstImageDoc.assetId as unknown as mongoose.Types.ObjectId,
    ]);
    if (asset) {
      const key = asset.storage?.key;
      imageUrl = key
        ? CloudinaryService.generateTransformationUrl(key, {
            width: 256,
            crop: "fill",
            gravity: "auto",
            aspect_ratio: "1:1",
            fetch_format: "auto",
            quality: "auto",
          })
        : asset.url || imageUrl;
    }
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <DonateClient
        slug={campaign.slug}
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


