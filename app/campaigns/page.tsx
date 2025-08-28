import Link from "next/link";
import mongoose from "mongoose";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import CampaignsGrid from "@/app/campaigns/CampaignsGrid";

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

  // Collect first image assetIds per campaign
  const campaignIdToFirstImageAssetId = new Map<string, string>();
  for (const c of campaigns) {
    const firstImageDoc = (c.documents || []).find((d) => d.type?.startsWith("image/"));
    if (firstImageDoc?.assetId) {
      campaignIdToFirstImageAssetId.set(String(c._id), String(firstImageDoc.assetId));
    }
  }

  // Fetch media assets in batch
  const allAssetIds = Array.from(campaignIdToFirstImageAssetId.values());
  const uniqueAssetIds = Array.from(new Set(allAssetIds));
  const assets = await mediaAssetService.listByIds(uniqueAssetIds.map((id) => new mongoose.Types.ObjectId(id)));
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
    const raisedMinor = c.totals?.raisedMinor ?? 0;
    const goalMinor = c.goal?.amountMinor ?? 0;
    const currency = c.goal?.currency || "SLE";
    const titleBase = c.patient?.name?.trim() || c.hospital?.name?.trim() || c.diagnosis?.trim() || c.slug;
    const imageAssetId = campaignIdToFirstImageAssetId.get(String(c._id));
    const img = imageAssetId ? assetIdToImage.get(imageAssetId) : undefined;
    const imageUrl = img?.src || "/assets/Hero.png";
    const imageSrcSet = img?.srcSet;
    const imageSizes = img?.sizes;
    return {
      id: String(c._id),
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
    <main className="py-8 md:py-16">
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="space-y-3 my-7 md:space-y-6">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">Browse fundraisers by category.</h2>
          <p>People around Sierra Leone and the world are raising money for what they are passionate about..</p>
          <Link href="/user/campaigns/new" className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 w-full sm:w-auto">Start a Campaign</Link>
        </div>

        <CampaignsGrid items={items} />

        <div className="flex flex-col items-center justify-center space-y-3 py-8 md:py-16">
          <h2 className="text-balance my-5 text-3xl font-medium lg:text-4xl">Start a fundraiser for yourself or someone else.</h2>
          <Link href="/more-campaigns" className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">Explore more Campaigns</Link>
        </div>
      </div>
    </main>
  );
}


