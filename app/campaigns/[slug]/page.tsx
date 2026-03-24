import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Heart, Info, CheckCircle, ChevronRight, Share2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import {
  donationRepository,
  campaignUpdateRepository,
  userRepository,
} from "@/repositories";
import CampaignTabs, { CampaignUpdateItem } from "./Tabs";
import DonorsTicker, { timeAgo } from "./DonorsTicker";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);

  if (!campaign) {
    return { title: 'Campaign Not Found' };
  }

  // Get beneficiary photo URL if available
  let imageUrl = 'https://ib4me.org/assets/Hero.png';
  if (campaign.patient?.photoAssetId) {
    const assets = await mediaAssetService.listByIds([campaign.patient.photoAssetId as mongoose.Types.ObjectId]);
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

  const patientName = campaign.patient?.name || 'a beneficiary';
  const goalAmount = campaign.goal?.amountMinor ? (campaign.goal.amountMinor / 100).toLocaleString() : '0';
  const raisedAmount = campaign.totals?.raisedMinor ? (campaign.totals.raisedMinor / 100).toLocaleString() : '0';
  const currency = campaign.goal?.currency || 'SLE';

  const title = `Help ${patientName} - Fundraiser on ib4me`;
  const description = `Help ${patientName} raise ${currency} ${goalAmount} for ${campaign.diagnosis || 'their cause'}. ${currency} ${raisedAmount} raised so far.`;
  const pageUrl = `https://ib4me.org/campaigns/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: patientName }],
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

  const title = campaign.patient?.name || campaign.diagnosis || campaign.slug;

  // Collect asset IDs: beneficiary photo (priority) and first document image (fallback)
  const assetIds: mongoose.Types.ObjectId[] = [];
  if (campaign.patient?.photoAssetId) {
    assetIds.push(campaign.patient.photoAssetId as mongoose.Types.ObjectId);
  }
  const firstImageDoc = (campaign.documents || []).find((d) =>
    d.type?.startsWith("image/"),
  );
  if (firstImageDoc?.assetId) {
    assetIds.push(firstImageDoc.assetId as unknown as mongoose.Types.ObjectId);
  }

  // Fetch assets in batch
  let heroUrl = "/assets/Hero.png";
  if (assetIds.length > 0) {
    const assets = await mediaAssetService.listByIds(assetIds);
    const assetMap = new Map(assets.map((a) => [String(a._id), a]));

    let resolvedUrl: string | null = null;
    if (campaign.patient?.photoAssetId) {
      const photoAsset = assetMap.get(String(campaign.patient.photoAssetId));
      if (photoAsset) {
        const key = photoAsset.storage?.key;
        resolvedUrl = key
          ? CloudinaryService.generateTransformationUrl(key, {
              width: 1280,
              crop: "fill",
              gravity: "auto",
              aspect_ratio: "16:9",
              fetch_format: "auto",
              quality: "auto",
            })
          : photoAsset.url || null;
      }
    }

    if (!resolvedUrl && firstImageDoc?.assetId) {
      const docAsset = assetMap.get(String(firstImageDoc.assetId));
      if (docAsset) {
        const key = docAsset.storage?.key;
        resolvedUrl = key
          ? CloudinaryService.generateTransformationUrl(key, {
              width: 1280,
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
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20 font-Sora">
      <main className="py-8 md:py-12">
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
            <section className="animate-fade-up space-y-6 lg:col-span-8">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
                <Image
                  src={heroUrl}
                  alt={title}
                  width={1280}
                  height={720}
                  className="size-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {!isCampaignVerified && (
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 rounded-xl">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    This campaign is pending verification. Donations are still accepted, but please review carefully before contributing.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="rounded-3xl border border-border/50 bg-card/70 shadow-xl backdrop-blur">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-4">
                    {isCampaignVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle className="h-3 w-3" /> Verified Campaign
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Campaign
                      </span>
                    )}
                    <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                      {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {supporters} supporter{supporters === 1 ? "" : "s"}
                      </span>
                      {createdLabel ? <span>• Created {createdLabel}</span> : null}
                    </div>
                  </div>

                  <CampaignTabs story={campaign.story} updates={updates} comments={[]} />
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

                    {isOwnerVerified ? (
                      <Button
                        asChild
                        className="h-11 w-full text-base font-semibold shadow-lg hover:shadow-xl"
                      >
                        <Link href={`/campaigns/${campaign.slug}/donate`}>Donate Now</Link>
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          disabled
                          className="h-11 w-full text-base font-semibold opacity-60"
                        >
                          Donations Paused
                        </Button>
                        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-xl">
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                          <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                            Donations are paused while the organizer completes identity verification.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

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
                    </div>

                    <Separator />

                    <Link href={`/creators/${String(campaign.ownerId)}`}>
                      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 hover:bg-muted/60 transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12">
                          {organizerPhoto ? (
                            <AvatarImage src={organizerPhoto} alt={organizerName} />
                          ) : (
                            <AvatarFallback>{organizerInitials}</AvatarFallback>
                          )}
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
                                title="This organizer's identity verification is pending"
                              >
                                Pending Verification
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
        </div>
      </main>
    </div>
  );
}
