import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Heart, Clock } from "lucide-react";
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
      imageUrl = CloudinaryService.generateTransformationUrl(asset.storage.key, {
        width: 1200,
        crop: 'fill',
        gravity: 'auto',
        aspect_ratio: '1.91:1',
        fetch_format: 'auto',
        quality: 'auto',
      });
    }
  }

  const patientName = campaign.patient?.name || 'a patient';
  const goalAmount = campaign.goal?.amountMinor ? (campaign.goal.amountMinor / 100).toLocaleString() : '0';
  const raisedAmount = campaign.totals?.raisedMinor ? (campaign.totals.raisedMinor / 100).toLocaleString() : '0';
  const currency = campaign.goal?.currency || 'SLE';

  const title = `Help ${patientName} - Medical Fundraiser`;
  const description = `Help ${patientName} raise ${currency} ${goalAmount} for ${campaign.diagnosis || 'medical treatment'}. ${currency} ${raisedAmount} raised so far.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: patientName }],
      type: 'website',
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

  const goalDeadline =
    (campaign.goal as { deadline?: string | Date } | null)?.deadline ?? null;
  const deadlineDate = goalDeadline ? new Date(goalDeadline) : null;
  const daysLeft =
    deadlineDate && !Number.isNaN(deadlineDate.getTime())
      ? Math.max(
          0,
          Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : null;

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

              <Card className="rounded-3xl border border-border/50 bg-card/70 shadow-xl backdrop-blur">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Medical Campaign
                    </span>
                    <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                      {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-blaze-orange">
                      <span>
                        {supporters} supporter{supporters === 1 ? "" : "s"}
                      </span>
                      {daysLeft !== null ? <span>• {daysLeft} days left</span> : null}
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
                        {daysLeft !== null ? (
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {daysLeft} days left
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      asChild
                      className="h-11 w-full text-base font-semibold shadow-lg hover:shadow-xl"
                    >
                      <Link href={`/campaigns/${campaign.slug}/donate`}>Donate Now</Link>
                    </Button>

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

                    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                      <Avatar className="h-12 w-12">
                        {organizerPhoto ? (
                          <AvatarImage src={organizerPhoto} alt={organizerName} />
                        ) : (
                          <AvatarFallback>{organizerInitials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {organizerName}
                        </p>
                        <p className="text-xs text-blaze-orange">
                          Campaign organizer
                          {createdLabel ? ` • Created ${createdLabel}` : ""}
                        </p>
                      </div>
                    </div>

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
