import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import mongoose from "mongoose";
import { ArrowRight } from "lucide-react";
import { campaignService, mediaAssetService, categoryService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import { getOGImageFromCampaigns, buildPageMetadata } from "@/lib/metadata";
import CampaignsGrid from "@/app/campaigns/CampaignsGrid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const campaigns = await campaignService.listActive();
  const ogImage = await getOGImageFromCampaigns(campaigns, "Fundraising campaigns on ib4me");

  return buildPageMetadata({
    title: "Fundraising Campaigns",
    description: "Browse and donate to verified fundraising campaigns in Sierra Leone. Help make a difference today.",
    image: ogImage,
    url: "https://ib4me.org/campaigns",
  });
}


type CampaignListItem = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  currency: string;
  amountRaised: number; // major units
  goalAmount: number; // major units
  donationsCount: number;
  imageUrl: string;
  imageSrcSet?: string;
  imageSizes?: string;
  category?: string;
  urgency?: "low" | "medium" | "high";
  verified?: boolean;
};

async function getActiveCampaigns(): Promise<CampaignListItem[]> {
  const campaigns = await campaignService.listActive();

  // Collect asset IDs: beneficiary photos (priority) and first document images (fallback)
  const campaignToBeneficiaryPhotoId = new Map<string, string>();
  const campaignToFirstDocImageId = new Map<string, string>();

  for (const c of campaigns) {
    const campaignId = String(c._id);

    // Beneficiary photo takes priority
    if (c.beneficiary?.photoAssetId) {
      campaignToBeneficiaryPhotoId.set(campaignId, String(c.beneficiary.photoAssetId));
    }

    // First document image as fallback
    const firstImageDoc = (c.documents || []).find((d) => d.type?.startsWith("image/"));
    if (firstImageDoc?.assetId) {
      campaignToFirstDocImageId.set(campaignId, String(firstImageDoc.assetId));
    }
  }

  // Collect all unique asset IDs for batch fetch
  const allAssetIds = [
    ...Array.from(campaignToBeneficiaryPhotoId.values()),
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
    const titleBase = c.beneficiary?.name?.trim() || c.institution?.name?.trim() || c.details?.trim() || c.slug;

    // Priority: beneficiary photo > document image > fallback
    const beneficiaryPhotoId = campaignToBeneficiaryPhotoId.get(campaignId);
    const docImageId = campaignToFirstDocImageId.get(campaignId);
    const img = beneficiaryPhotoId
      ? assetIdToImage.get(beneficiaryPhotoId)
      : docImageId
        ? assetIdToImage.get(docImageId)
        : undefined;

    const imageUrl = img?.src || "/assets/Hero.png";
    const imageSrcSet = img?.srcSet;
    const imageSizes = img?.sizes;

    const description = c.story
      ? c.story.replace(/<[^>]+>/g, "").trim().slice(0, 160) || undefined
      : undefined;

    return {
      id: campaignId,
      slug: c.slug,
      title: titleBase,
      description,
      currency,
      amountRaised: Math.max(0, Math.floor(raisedMinor) / 100),
      goalAmount: Math.max(0, Math.floor(goalMinor) / 100),
      donationsCount: c.totals?.donationCount ?? 0,
      imageUrl,
      imageSrcSet,
      imageSizes,
      category: c.category,
      urgency: c.urgency,
      verified: c.verification?.status === "approved",
      ownerVerified: c.ownerVerification?.verified ?? false,
    };
  });
}

function GridSkeleton() {
  return (
    <div className="py-10">
      <div className="flex flex-col items-center space-y-6">
        <Skeleton className="h-12 w-full max-w-[30rem] rounded-full" />
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-3xl border border-border/40 p-4">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CampaignsListPage() {
  const [items, categories] = await Promise.all([
    getActiveCampaigns(),
    categoryService.findActive(),
  ]);
  const categoryData = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? null,
  }));

  return (
    <div className="min-h-screen bg-background font-Sora">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-fun-green py-14 sm:py-18 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blaze-orange/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Browse <span className="text-blaze-orange">Campaigns</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            People around Sierra Leone and the world are raising money for what they are passionate about.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="rounded-xl bg-blaze-orange hover:bg-blaze-orange/90 text-white">
              <Link href="/dashboard">
                Start a Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
            <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" fill="white" />
          </svg>
        </div>
      </section>

      <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<GridSkeleton />}>
          <CampaignsGrid items={items} categories={categoryData} />
        </Suspense>

        {/* Bottom CTA */}
        <div className="flex flex-col items-center justify-center space-y-4 py-14 sm:py-18 lg:py-24 text-center">
          <h2 className="text-balance text-3xl font-bold lg:text-4xl">
            Start a fundraiser for yourself or someone else.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Whether it&apos;s for health, education, community, or emergency relief — your cause matters.
          </p>
          <Button asChild size="lg" className="rounded-xl bg-blaze-orange hover:bg-blaze-orange/90 text-white">
            <Link href="/dashboard">
              Start a Campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
