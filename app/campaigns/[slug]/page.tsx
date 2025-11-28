import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Heart, Info, CheckCircle } from "lucide-react";
import {
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
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

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);

  if (!campaign) {
    return { title: 'Campaign Not Found' };
  }

  // Get patient photo URL if available
  let imageUrl = 'https://ib4me.org/assets/Hero.png';
  if (campaign.patient?.photoAssetId) {
    const assets = await mediaAssetService.listByIds([campaign.patient.photoAssetId as mongoose.Types.ObjectId]);
    const asset = assets[0];
    if (asset?.storage?.key) {
      // Use Cloudinary transformation for optimal OG image
      imageUrl = CloudinaryService.generateTransformationUrl(asset.storage.key, {
        width: 1200,
        crop: 'fill',
        gravity: 'auto',
        aspect_ratio: '1.91:1',
        fetch_format: 'jpg',  // Use jpg for better crawler compatibility
        quality: 'auto',
      });
    } else if (asset?.url) {
      // Fallback to stored URL if no storage key
      imageUrl = asset.url;
    }
  }

  const patientName = campaign.patient?.name || 'a patient';
  const goalAmount = campaign.goal?.amountMinor ? (campaign.goal.amountMinor / 100).toLocaleString() : '0';
  const raisedAmount = campaign.totals?.raisedMinor ? (campaign.totals.raisedMinor / 100).toLocaleString() : '0';
  const currency = campaign.goal?.currency || 'SLE';

  const title = `Help ${patientName} - Medical Fundraiser`;
  const description = `Help ${patientName} raise ${currency} ${goalAmount} for ${campaign.diagnosis || 'medical treatment'}. ${currency} ${raisedAmount} raised so far.`;
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
    month: "2-digit",
    day: "2-digit",
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

  // Collect asset IDs: patient photo (priority) and first document image (fallback)
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

    // Try patient photo first
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

    // Fallback to first document image
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

  // Check if campaign owner is verified
  const isOwnerVerified = campaign.ownerVerification?.verified ?? false;
  // Check if campaign content is verified by admin
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const absoluteUrl = `${siteUrl}/campaigns/${campaign.slug}`;

  const shareLinks = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        absoluteUrl,
      )}`,
      icon: FaFacebookF,
      bgColor: "bg-blue-50",
      hoverbg: "hover:border-blue-300"
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        absoluteUrl,
      )}&text=${encodeURIComponent(title)}`,
      icon: FaXTwitter,
      bgColor: "bg-gray-50",
      hoverbg: "hover:border-gray-400"
    },
    {
      name: "Instagram",
      href: `https://www.instagram.com/?url=${encodeURIComponent(absoluteUrl)}`,
      icon: FaInstagram,
      bgColor: "bg-pink-50",
      hoverbg: "hover:border-pink-300"
    },
    
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} – ${absoluteUrl}`)}`,
      icon: FaWhatsapp,
      bgColor: "bg-green-50",
      hoverbg: "hover:border-green-300"
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        absoluteUrl,
      )}`,
      icon: FaLinkedinIn,
      bgColor: "bg-blue-50",
      hoverbg: "hover:border-blue-400"
    },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20">
      <main className="py-8 md:py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <section className="space-y-6 lg:col-span-8">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
                <Image
                  src={heroUrl}
                  alt={title}
                  width={1280}
                  height={720}
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100" />
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
                        Medical Campaign
                      </span>
                    )}
                    <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                      {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-blaze-orange">
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

            <aside className="space-y-6 lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-6">
                <Card className="overflow-hidden rounded-3xl border border-border/50 shadow-xl">
                  <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
                  <CardContent className="space-y-6 p-5 sm:p-6">
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-3xl font-semibold text-primary">
                          {formatAmount(amountRaised, currency)}
                        </span>
                        <span className="text-sm text-blaze-orange">
                          of {formatAmount(goalAmount, currency)} goal
                        </span>
                      </div>
                      <Progress value={progress} className="mt-4 h-3" />
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-blaze-orange">
                        <span className="inline-flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          {supporters} supporter{supporters === 1 ? "" : "s"}
                        </span>
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
                      <h3 className="text-center text-sm font-semibold text-blaze-orange">
                        Share Campaign
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {shareLinks.map(({ name, href, icon: Icon, bgColor, hoverbg}) => (
                          <Button
                            key={name}
                            variant="outline"
                            size="icon"
                            className={`${bgColor} ${hoverbg} flex-1 min-w-12`}
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
                                title="This organizer&apos;s identity verification is pending"
                              >
                                Pending Verification
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-blaze-orange">
                            Campaign organizer
                            {createdLabel ? ` • Created ${createdLabel}` : ""}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Recent Donations
                      </h4>
                      <div className="mt-3 space-y-3">
                        {recentDonations.length === 0 ? (
                          <p className="text-sm text-blaze-orange">
                            No donations yet.
                          </p>
                        ) : (
                          recentDonations.map((d) => (
                            <div
                              key={String(d._id)}
                              className="rounded-xl border border-border/50 bg-muted/30 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {d.isAnonymous
                                      ? "Anonymous"
                                      : d.donorSnapshot?.name || "Supporter"}
                                  </p>
                                  <p className="text-xs text-blaze-orange">
                                    {formatDate(d.createdAt)}
                                  </p>
                                  {d.message ? (
                                    <p className="mt-2 text-sm text-blaze-orange italic">
                                      “{d.message}”
                                    </p>
                                  ) : null}
                                </div>
                                <p className="text-sm font-semibold text-primary">
                                  {formatAmount(
                                    Math.floor((d.amount?.minor ?? 0) / 100),
                                    d.amount?.currency || currency,
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
        <div className="mt-10 text-center text-sm">
          <Link href="/campaigns" className="text-blaze-orange hover:text-primary">
            ← Back to all campaigns
          </Link>
        </div>
      </main>
    </div>
  );
}
