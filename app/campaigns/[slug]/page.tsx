import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Heart, CheckCircle, ChevronRight, Share2, Info } from "lucide-react";
import {
  FaFacebookF,
  FaXTwitter,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarDataUri } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert } from "lucide-react";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import {
  donationRepository,
  campaignUpdateRepository,
  userRepository,
  campaignRepository,
} from "@/repositories";
import CampaignTabs, { type CampaignUpdateItem } from "./Tabs";
import DonorsTicker from "./DonorsTicker";
import WordsOfSupportSection from "./WordsOfSupportSection";
import SimilarCampaignsSection, { type SimilarCampaign } from "./SimilarCampaignsSection";
import { timeAgo } from "@/lib/utils";
import ShareImageButton from "./ShareImageButton";

function buildResponsiveHero(key: string) {
  const widths = [320, 480, 640, 768, 1024, 1280];
  const base = {
    crop: "fill" as const,
    gravity: "auto",
    aspect_ratio: "16:9",
    fetch_format: "auto",
    quality: "auto",
  };
  const src = CloudinaryService.generateTransformationUrl(key, { ...base, width: 768 });
  const srcSet = widths
    .map(
      (w) =>
        `${CloudinaryService.generateTransformationUrl(key, { ...base, width: w })} ${w}w`,
    )
    .join(", ");
  const sizes = "(min-width: 1024px) 66vw, 100vw";
  return { src, srcSet, sizes };
}

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);

  if (!campaign) {
    return { title: 'Campaign Not Found' };
  }

  // Collect asset IDs: beneficiary photo first, then first document image as fallback
  const ogAssetIds: mongoose.Types.ObjectId[] = [];
  if (campaign.beneficiary?.photoAssetId) {
    ogAssetIds.push(campaign.beneficiary.photoAssetId as mongoose.Types.ObjectId);
  }
  const firstDocImage = (campaign.documents || []).find((d) =>
    d.type?.startsWith("image/")
  );
  if (firstDocImage?.assetId) {
    ogAssetIds.push(firstDocImage.assetId as unknown as mongoose.Types.ObjectId);
  }

  let imageUrl = 'https://ib4me.org/assets/Hero.png';
  if (ogAssetIds.length > 0) {
    const assets = await mediaAssetService.listByIds(ogAssetIds);
    const asset = assets[0];
    if (asset?.storage?.key) {
      imageUrl = CloudinaryService.generateTransformationUrl(asset.storage.key, {
        width: 1200,
        crop: 'fill',
        gravity: 'auto',
        aspect_ratio: '1.91:1',
        fetch_format: 'jpg',
        quality: 'auto',
      });
    } else if (asset?.url) {
      imageUrl = asset.url;
    }
  }

  const beneficiaryName = campaign.beneficiary?.name || 'a beneficiary';
  const goalAmount = campaign.goal?.amountMinor ? (campaign.goal.amountMinor / 100).toLocaleString() : '0';
  const raisedAmount = campaign.totals?.raisedMinor ? (campaign.totals.raisedMinor / 100).toLocaleString() : '0';
  const currency = campaign.goal?.currency || 'SLE';

  const title = `Help ${beneficiaryName} - Fundraiser on ib4me`;
  const description = `Help ${beneficiaryName} raise ${currency} ${goalAmount} for ${campaign.details || 'their cause'}. ${currency} ${raisedAmount} raised so far.`;
  const pageUrl = `https://ib4me.org/campaigns/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: beneficiaryName }],
      type: 'website',
      siteName: 'ib4me',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

function formatAmount(amount: number, currency: string = "SLE") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CampaignDetailPage({ params }: PageParams) {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);
  if (!campaign) return notFound();

  const currency = campaign.goal?.currency || "SLE";
  const raisedMinor = campaign.totals?.raisedMinor ?? 0;
  const goalMinor = campaign.goal?.amountMinor ?? 0;
  const amountRaised = Math.max(0, Math.floor(raisedMinor) / 100);
  const goalAmount = Math.max(0, Math.floor(goalMinor) / 100);
  const progress =
    goalAmount > 0 ? Math.min(100, Math.round((amountRaised / goalAmount) * 100)) : 0;

  const title = campaign.beneficiary?.name || campaign.details || campaign.slug;

  // Collect asset IDs: beneficiary photo (priority) and first document image (fallback)
  const assetIds: mongoose.Types.ObjectId[] = [];
  if (campaign.beneficiary?.photoAssetId) {
    assetIds.push(campaign.beneficiary.photoAssetId as mongoose.Types.ObjectId);
  }
  const firstImageDoc = (campaign.documents || []).find((d) =>
    d.type?.startsWith("image/"),
  );
  if (firstImageDoc?.assetId) {
    assetIds.push(firstImageDoc.assetId as unknown as mongoose.Types.ObjectId);
  }

  // Fetch assets in batch
  let heroUrl = "/assets/Hero.png";
  let heroSrcSet: string | undefined;
  let heroSizes: string | undefined;
  if (assetIds.length > 0) {
    const assets = await mediaAssetService.listByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [String(a._id), a]));

    let resolvedUrl: string | null = null;
    if (campaign.beneficiary?.photoAssetId) {
      const photoAsset = assetMap.get(String(campaign.beneficiary.photoAssetId));
      if (photoAsset) {
        const key = photoAsset.storage?.key;
        if (key) {
          const responsive = buildResponsiveHero(key);
          resolvedUrl = responsive.src;
          heroSrcSet = responsive.srcSet;
          heroSizes = responsive.sizes;
        } else {
          resolvedUrl = photoAsset.url || null;
        }
      }
    }

    if (!resolvedUrl && firstImageDoc?.assetId) {
      const docAsset = assetMap.get(String(firstImageDoc.assetId));
      if (docAsset) {
        const key = docAsset.storage?.key;
        if (key) {
          const responsive = buildResponsiveHero(key);
          resolvedUrl = responsive.src;
          heroSrcSet = responsive.srcSet;
          heroSizes = responsive.sizes;
        } else {
          resolvedUrl = docAsset.url || null;
        }
      }
    }

    if (resolvedUrl) {
      heroUrl = resolvedUrl;
    }
  }

  const organizer = campaign.ownerId
    ? await userRepository.findById(String(campaign.ownerId))
    : null;

  const isOwnerVerified = campaign.ownerVerification?.verified ?? false;
  const isCampaignVerified = campaign.verification?.status === "approved";

  const donations = await donationRepository.listByCampaign(
    campaign._id as mongoose.Types.ObjectId,
  );
  const recentDonations = donations
    .filter((d) => d.status === "succeeded")
    .slice(0, 5);

  const updatesDocs = await campaignUpdateRepository.findMany({
    campaignId: campaign._id as mongoose.Types.ObjectId,
  } as never);
  const updates: CampaignUpdateItem[] = updatesDocs.map((u) => ({
    id: String(u._id),
    content: u.content,
    createdAt: new Date(u.createdAt).toISOString(),
  }));

  const supporters = campaign.totals?.donationCount ?? recentDonations.length ?? 0;

  const organizerName = organizer?.name ?? "Campaign organizer";
  const organizerInitials = organizerName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const organizerPhoto = organizer?.photoUrl ?? null;
  const createdLabel = campaign.createdAt ? formatDate(campaign.createdAt) : null;

  // Fetch similar campaigns (other active campaigns, excluding this one)
  const similarRaw = await campaignRepository.findMany({
    status: "active",
    _id: { $ne: campaign._id },
  } as never, { query: { sort: { createdAt: -1 }, limit: 3 } });

  const similarAssetIds: mongoose.Types.ObjectId[] = [];
  for (const c of similarRaw) {
    const docs = (c.documents as unknown as { type?: string; assetId?: mongoose.Types.ObjectId }[]) || [];
    const img = docs.find((d) => d.type?.startsWith("image/"));
    if (img?.assetId) similarAssetIds.push(img.assetId);
  }
  const similarAssets = similarAssetIds.length
    ? await mediaAssetService.listByIds(similarAssetIds)
    : [];
  const similarAssetMap = new Map(similarAssets.map((a) => [String(a._id), a]));

  const similarCampaigns: SimilarCampaign[] = similarRaw.map((c) => {
    const docs = (c.documents as unknown as { type?: string; assetId?: mongoose.Types.ObjectId }[]) || [];
    const img = docs.find((d) => d.type?.startsWith("image/"));
    const asset = img?.assetId ? similarAssetMap.get(String(img.assetId)) : null;
    const imgUrl = asset?.storage?.key
      ? CloudinaryService.generateTransformationUrl(asset.storage.key, { width: 768, crop: "fill", gravity: "auto", aspect_ratio: "16:9", fetch_format: "auto", quality: "auto" })
      : asset?.url || "/assets/Hero.png";
    const raisedMinor = (c.totals as unknown as { raisedMinor?: number })?.raisedMinor ?? 0;
    const goalMinor = (c.goal as unknown as { amountMinor?: number })?.amountMinor ?? 0;
    const cur = (c.goal as unknown as { currency?: string })?.currency || "SLE";
    return {
      id: String(c._id),
      slug: c.slug,
      title: (c.beneficiary as unknown as { name?: string })?.name || (c as { details?: string }).details || c.slug,
      amountRaised: Math.floor(raisedMinor) / 100,
      goalAmount: Math.floor(goalMinor) / 100,
      donationsCount: (c.totals as unknown as { donationCount?: number })?.donationCount ?? 0,
      currency: cur,
      ownerVerified: (c as { ownerVerification?: { verified?: boolean } }).ownerVerification?.verified ?? false,
      imageUrl: imgUrl,
    };
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ib4me.org";
  const absoluteUrl = `${siteUrl}/campaigns/${campaign.slug}`;
  const shareText = `Help ${title} — ${formatAmount(amountRaised, currency)} raised of ${formatAmount(goalAmount, currency)} goal`;

  const shareLinks = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl)}`,
      icon: FaFacebookF,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:border-blue-300",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(absoluteUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: FaXTwitter,
      bgColor: "bg-muted",
      hoverBg: "hover:bg-muted/80 hover:border-foreground/30",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${absoluteUrl}`)}`,
      icon: FaWhatsapp,
      bgColor: "bg-green-50 dark:bg-green-950/20",
      hoverBg: "hover:bg-green-100 dark:hover:bg-green-950/40 hover:border-green-300",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl)}`,
      icon: FaLinkedinIn,
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:border-blue-400",
    },
  ];

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gradient-to-b from-background to-muted/20 font-Sora pb-20 md:pb-0">
      {/* Mobile sticky donate bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-none mb-0.5">Raised so far</p>
            <p className="text-sm font-bold text-primary truncate">{formatAmount(amountRaised, currency)} <span className="text-muted-foreground font-normal text-xs">of {formatAmount(goalAmount, currency)}</span></p>
          </div>
          <Button asChild className="ml-auto shrink-0 h-10 px-6 font-semibold shadow-md">
            <Link href={`/campaigns/${campaign.slug}/donate`}>Donate Now</Link>
          </Button>
        </div>
      </div>

      {/* Non-dismissible unverified banner — shown at very top of page */}
      {!isOwnerVerified && (
        <div className="w-full bg-amber-500 text-white px-4 py-2.5">
          <div className="mx-auto max-w-6xl flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>This campaign organizer has not been verified. Review carefully before contributing.</span>
          </div>
        </div>
      )}

      <div className="py-8 md:py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/campaigns" className="hover:text-primary transition-colors">
              Campaigns
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate text-foreground font-medium">{title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12">
            <section className="animate-fade-up min-w-0 space-y-6 lg:col-span-8">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroUrl}
                  srcSet={heroSrcSet}
                  sizes={heroSizes}
                  alt={title}
                  width={1280}
                  height={720}
                  className="size-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
              </div>


              <Card className="rounded-3xl border border-border/50 bg-card/70 shadow-xl backdrop-blur">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-4">
                    {isCampaignVerified ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 cursor-help">
                            <CheckCircle className="h-3 w-3" /> Verified Campaign
                            <Info className="h-3 w-3 opacity-60" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[240px] text-xs">
                          ib4me has verified this organizer&apos;s identity and confirmed the campaign&apos;s purpose. <a href="/faqs" className="underline">Learn more</a>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Campaign
                      </span>
                    )}
                    <h1 className="break-words text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                      {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {supporters} supporter{supporters === 1 ? "" : "s"}
                      </span>
                      {createdLabel ? <span>• Created {createdLabel}</span> : null}
                    </div>
                  </div>

                  <CampaignTabs
                    story={campaign.story}
                    updates={updates}
                    campaignId={String(campaign._id)}
                  />
                </CardContent>
              </Card>
            </section>

            <aside className="animate-fade-up delay-200 space-y-6 lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-6">
                <Card className="overflow-hidden rounded-3xl border border-border/50 shadow-xl">
                  <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
                  <CardContent className="space-y-6 p-5 sm:p-6">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-3xl font-semibold text-primary">
                          {formatAmount(amountRaised, currency)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          of {formatAmount(goalAmount, currency)} goal
                        </span>
                      </div>
                      <Progress value={progress} className="mt-4 h-3" />
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          {supporters} supporter{supporters === 1 ? "" : "s"}
                        </span>
                        <span className="font-semibold text-primary">{progress}%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        asChild
                        className="h-11 w-full text-base font-semibold shadow-lg hover:shadow-xl"
                      >
                        <Link href={`/campaigns/${campaign.slug}/donate`}>Donate Now</Link>
                      </Button>
                      {!isOwnerVerified && (
                        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-xl">
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                          <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                            This organizer has not verified their identity. Donate at your own discretion.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div>
                      <h3 className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                        <Share2 className="h-4 w-4" />
                        Share Campaign
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {shareLinks.map(({ name, href, icon: Icon, bgColor, hoverBg }) => (
                          <Button
                            key={name}
                            variant="outline"
                            size="icon"
                            className={`${bgColor} ${hoverBg} flex-1 min-w-12 transition-colors`}
                            asChild
                          >
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Share on ${name}`}
                            >
                              <Icon className="h-4 w-4" />
                            </a>
                          </Button>
                        ))}
                      </div>
                      <ShareImageButton
                        campaign={{
                          slug: campaign.slug,
                          beneficiary: campaign.beneficiary
                            ? { name: campaign.beneficiary.name ?? undefined, age: campaign.beneficiary.age ?? undefined }
                            : undefined,
                          institution: campaign.institution
                            ? { name: campaign.institution.name ?? undefined }
                            : undefined,
                          details: campaign.details ?? undefined,
                          goal: {
                            currency: campaign.goal?.currency ?? undefined,
                            amountMinor: campaign.goal?.amountMinor != null ? Number(campaign.goal.amountMinor) : undefined,
                          },
                          totals: {
                            raisedMinor: Number(campaign.totals?.raisedMinor ?? 0),
                            donationCount: Number(campaign.totals?.donationCount ?? 0),
                          },
                          story: campaign.story ?? undefined,
                          urgency: campaign.urgency ?? undefined,
                          isVerified: isCampaignVerified,
                          imageUrl: heroUrl,
                        }}
                      />
                    </div>

                    <Separator />

                    <Link href={`/creators/${String(campaign.ownerId)}`}>
                      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 hover:bg-muted/60 transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={organizerPhoto ?? generateAvatarDataUri(String(campaign.ownerId))}
                            alt={organizerName}
                          />
                          <AvatarFallback>{organizerInitials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors">
                              {organizerName}
                            </p>
                            {!isOwnerVerified && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800"
                                title="This organizer has not completed identity verification"
                              >
                                Unverified Organizer
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Campaign organizer
                            {createdLabel ? ` • Created ${createdLabel}` : ""}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Separator />

                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Recent Donations
                      </h4>
                      {recentDonations.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 text-center">
                          <Heart className="mx-auto h-6 w-6 text-muted-foreground/50" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            No donations yet. Be the first to support!
                          </p>
                        </div>
                      ) : (
                        <DonorsTicker
                          donors={recentDonations.map((d) => ({
                            name: d.isAnonymous ? "Anonymous" : (d.donorSnapshot?.name || "Supporter"),
                            amount: formatAmount(Math.floor((d.amount?.minor ?? 0) / 100), d.amount?.currency || currency),
                            timeAgo: timeAgo(d.createdAt),
                            message: d.message || undefined,
                          }))}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>

          {/* Words of Support — full width below main grid */}
          <div className="mt-8">
            <WordsOfSupportSection campaignId={String(campaign._id)} />
          </div>

          {/* Similar Campaigns */}
          <SimilarCampaignsSection campaigns={similarCampaigns} />
        </div>
      </div>
    </div>
  );
}
