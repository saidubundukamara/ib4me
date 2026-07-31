import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { campaignService, mediaAssetService, settingService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import { userRepository } from "@/repositories";
import { slugToTitle } from "@/lib/utils";
import DonateClient from "./DonateClient";

type PageParams = {
  params: Promise<{ slug: string }>;
};

export default async function CampaignDonatePage({ params }: PageParams) {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);
  if (!campaign) return notFound();

  const currency = campaign.goal?.currency || "SLE";
  // Minor units all the way to the render layer. These used to be divided by 100 here,
  // which threw away the cents of a figure that is now a net amount with cents in it.
  const amountRaisedMinor = Math.max(0, campaign.totals?.raisedMinor ?? 0);
  const goalMinor = Math.max(0, campaign.goal?.amountMinor ?? 0);
  const progress =
    goalMinor > 0 ? Math.min(100, Math.round((amountRaisedMinor / goalMinor) * 100)) : 0;
  const title = campaign.title || slugToTitle(slug);

  const organizer = campaign.ownerId ? await userRepository.findById(String(campaign.ownerId)) : null;
  const isOwnerVerified = campaign.ownerVerification?.verified ?? false;

  // Fee rates for this campaign type. Both come from the DB and are passed down so the
  // donate page never hardcodes a percentage (MONIME-FEE-MODEL.md §8.2).
  const feeSettings = await settingService.getFeeSettings();
  const campaignId = String(campaign._id);
  const campaignType = await campaignService.getCampaignType(campaignId);
  const processingFeeBps = campaignType === "organization"
    ? feeSettings.processingFee.organizationBps
    : feeSettings.processingFee.individualBps;
  const monimeFeeBpsEstimate = feeSettings.monimeCollectionFeeBpsEstimate;

  // Admin-configurable quick-pick amounts, from main.
  const featureSettings = await settingService.getFeatureSettings();
  const donationPresets = featureSettings.donationPresets ?? [50, 250, 500];

  // No tip control here. The in-flow tip slider was removed: the amount it collected was
  // added to the donor's charge but never recorded as a tip, never moved to the tip
  // account, and never appeared in any report. Tipping is now offered after the donation
  // completes, as its own properly-booked transaction.

  // Collect asset IDs: beneficiary photo (priority) and first document image (fallback)
  const assetIds: mongoose.Types.ObjectId[] = [];
  if (campaign.beneficiary?.photoAssetId) {
    assetIds.push(campaign.beneficiary.photoAssetId as mongoose.Types.ObjectId);
  }
  const firstImageDoc = (campaign.documents || []).find((d) => d.type?.startsWith("image/"));
  if (firstImageDoc?.assetId) {
    assetIds.push(firstImageDoc.assetId as unknown as mongoose.Types.ObjectId);
  }

  let imageUrl = "/assets/campaignplaceholderimage.png";
  if (assetIds.length > 0) {
    const assets = await mediaAssetService.listByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [String(a._id), a]));

    // Try beneficiary photo first
    let resolvedUrl: string | null = null;
    if (campaign.beneficiary?.photoAssetId) {
      const photoAsset = assetMap.get(String(campaign.beneficiary.photoAssetId));
      if (photoAsset) {
        const key = photoAsset.storage?.key;
        resolvedUrl = key
          ? CloudinaryService.generateTransformationUrl(key, {
              width: 1200,
              crop: "fill",
              gravity: "auto",
              aspect_ratio: "16:9",
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
              width: 1200,
              crop: "fill",
              gravity: "auto",
              aspect_ratio: "16:9",
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
        amountRaisedMinor={amountRaisedMinor}
        goalAmountMinor={goalMinor}
        imageUrl={imageUrl}
        processingFeeBps={processingFeeBps}
        monimeFeeBpsEstimate={monimeFeeBpsEstimate}
        isOwnerVerified={isOwnerVerified}
        presetAmounts={donationPresets}
      />
    </main>
  );
}


