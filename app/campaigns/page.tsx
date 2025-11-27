import { Metadata } from "next";
import Link from "next/link";
import mongoose from "mongoose";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import CampaignsGrid from "@/app/campaigns/CampaignsGrid";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: 'Medical Fundraising Campaigns',
  description: 'Browse and donate to verified medical emergency campaigns in Sierra Leone. Help save lives today.',
};


type CampaignListItem = {
  id: string;
  slug: string;
  title: string;
  currency: string;
  amountRaised: number; // major units
  goalAmount: number; // major units
  donationsCount: number;
  imageUrl: string;
  imageSrcSet?: string;
  imageSizes?: string;
};

async function getActiveCampaigns(): Promise<CampaignListItem[]> {
  const campaigns = await campaignService.listActive();

  // Collect asset IDs: patient photos (priority) and first document images (fallback)
  const campaignToPatientPhotoId = new Map<string, string>();
  const campaignToFirstDocImageId = new Map<string, string>();

  for (const c of campaigns) {
    const campaignId = String(c._id);

    // Patient photo takes priority
    if (c.patient?.photoAssetId) {
      campaignToPatientPhotoId.set(campaignId, String(c.patient.photoAssetId));
    }

    // First document image as fallback
    const firstImageDoc = (c.documents || []).find((d) => d.type?.startsWith("image/"));
    if (firstImageDoc?.assetId) {
      campaignToFirstDocImageId.set(campaignId, String(firstImageDoc.assetId));
    }
  }

  // Collect all unique asset IDs for batch fetch
  const allAssetIds = [
    ...Array.from(campaignToPatientPhotoId.values()),
    ...Array.from(campaignToFirstDocImageId.values()),
  ];
  const uniqueAssetIds = Array.from(new Set(allAssetIds));

  // Fetch media assets in batch
  const assets = uniqueAssetIds.length > 0
    ? await mediaAssetService.listByIds(uniqueAssetIds.map((id) => new mongoose.Types.ObjectId(id)))
    : [];

  // Build asset ID to image URL map
  const assetIdToImage = new Map<string, { src: string; srcSet?: string; sizes?: string }>();
  for (const a of assets) {
    const key = a.storage?.key;
    if (key) {
      const widths = [320, 480, 640, 768, 1024, 1280];
      const srcSet = widths
        .map((w) =>
          `${CloudinaryService.generateTransformationUrl(key, {
            width: w,
            crop: "fill",
            gravity: "auto",
            aspect_ratio: "16:9",
            fetch_format: "auto",
            quality: "auto",
          })} ${w}w`
        )
        .join(", ");
      const src = CloudinaryService.generateTransformationUrl(key, {
        width: 768,
        crop: "fill",
        gravity: "auto",
        aspect_ratio: "16:9",
        fetch_format: "auto",
        quality: "auto",
      });
      const sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
      assetIdToImage.set(String(a._id), { src, srcSet, sizes });
    } else {
      const url = a.url || "";
      assetIdToImage.set(String(a._id), { src: url });
    }
  }

  return campaigns.map((c) => {
    const campaignId = String(c._id);
    const raisedMinor = c.totals?.raisedMinor ?? 0;
    const goalMinor = c.goal?.amountMinor ?? 0;
    const currency = c.goal?.currency || "SLE";
    const titleBase = c.patient?.name?.trim() || c.hospital?.name?.trim() || c.diagnosis?.trim() || c.slug;

    // Priority: patient photo > document image > fallback
    const patientPhotoId = campaignToPatientPhotoId.get(campaignId);
    const docImageId = campaignToFirstDocImageId.get(campaignId);
    const img = patientPhotoId
      ? assetIdToImage.get(patientPhotoId)
      : docImageId
        ? assetIdToImage.get(docImageId)
        : undefined;

    const imageUrl = img?.src || "/assets/Hero.png";
    const imageSrcSet = img?.srcSet;
    const imageSizes = img?.sizes;

    return {
      id: campaignId,
      slug: c.slug,
      title: titleBase,
      currency,
      amountRaised: Math.max(0, Math.floor(raisedMinor) / 100),
      goalAmount: Math.max(0, Math.floor(goalMinor) / 100),
      donationsCount: c.totals?.donationCount ?? 0,
      imageUrl,
      imageSrcSet,
      imageSizes,
    };
  });
}

export default async function CampaignsListPage() {
  const items = await getActiveCampaigns();

  return (
    <section className="py-8 md:py-16 font-Sora">
      <div className="mx-auto max-w-screen-xl container px-6 sm:px-0">
        {/* Text Content */}
        <div className="space-y-3 my-7 md:space-y-6">
          <h2 className="text-balance text-4xl font-bold lg:text-5xl">
            Browse <span className="text-blaze-orange">Campaigns</span> by category.
          </h2>
          <p>
            People around Sierra Leone and the world are raising money for what they are passionate about..
          </p>
        </div>
        <Link href="/dashboard">
          <Button className="w-full cursor-pointer sm:w-auto rounded-xl">
            Start a Campaign
          </Button>
        </Link>

        <CampaignsGrid items={items} />
        <div className="flex flex-col items-center justify-center space-y-3 py-8 md:py-16">
          <h2 className="text-balance my-5 text-3xl font-medium lg:text-4xl">
            Start a fundraiser for yourself or someone else.
          </h2>
          <Link href="/dashboard" className="flex items-center justify-center gap-2">
          <Button className="w-full cursor-pointer sm:w-auto bg-blaze-orange hover:bg-blaze-orange/90 ">
              Start a Campaign
          </Button>
           </Link>
        </div>
      </div>
    </section>
  );
}


