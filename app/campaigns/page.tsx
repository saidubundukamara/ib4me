import Link from "next/link";
import mongoose from "mongoose";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import CampaignsGrid from "@/app/campaigns/CampaignsGrid";
import { Button } from "@/components/ui/button";


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
        <Link href="/dashboard/campaigns/new">
          <Button className="w-full cursor-pointer sm:w-auto rounded-xl">
            Start a Campaign
          </Button>
        </Link>

        <CampaignsGrid items={items} />

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="rounded-full">
            Load More Campaigns
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-3 py-8 md:py-16">
          <h2 className="text-balance my-5 text-3xl font-medium lg:text-4xl">
            Start a fundraiser for yourself or someone else.
          </h2>
          <Link href="/dashboard/campaigns/new" className="flex items-center justify-center gap-2">
          <Button className="w-full cursor-pointer sm:w-auto bg-blaze-orange hover:bg-blaze-orange/90 ">
              Start a Campaign
          </Button>
           </Link>
        </div>
      </div>
    </section>
  );
}


