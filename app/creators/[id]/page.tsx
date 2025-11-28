import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { MapPin, Calendar, Globe, Building2, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { userService, campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import { getOGImageFromCampaigns, buildPageMetadata } from "@/lib/metadata";
import CreatorCampaignsGrid from "./CreatorCampaignsGrid";

type PageParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { title: "Creator Not Found" };
  }

  // Fetch profile AND campaigns in parallel
  const [profile, campaignsData] = await Promise.all([
    userService.getPublicProfile(id),
    campaignService.listPublicByOwner(id, { limit: 5 }),
  ]);

  if (!profile) {
    return { title: "Creator Not Found" };
  }

  const displayName = profile.isOrganization && profile.organization?.name
    ? profile.organization.name
    : profile.name;

  const title = `${displayName} | IB4ME`;
  const description = profile.isOrganization && profile.organization?.description
    ? profile.organization.description
    : `View campaigns by ${displayName} on IB4ME.`;

  // Get OG image from creator's campaigns
  const ogImage = await getOGImageFromCampaigns(
    campaignsData.campaigns,
    `Campaigns by ${displayName}`
  );

  return buildPageMetadata({
    title,
    description,
    image: ogImage,
    type: "profile",
    url: `https://ib4me.org/creators/${id}`,
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function formatAmount(amount: number, currency: string = "SLE") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function CreatorProfilePage({ params }: PageParams) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return notFound();
  }

  const [profile, campaignsData] = await Promise.all([
    userService.getPublicProfile(id),
    campaignService.listPublicByOwner(id, { limit: 12 }),
  ]);

  if (!profile) {
    return notFound();
  }

  const { campaigns } = campaignsData;

  // Calculate aggregate stats
  let totalRaised = 0;
  let totalSupporters = 0;
  for (const c of campaigns) {
    totalRaised += c.totals?.raisedMinor ?? 0;
    totalSupporters += c.totals?.donationCount ?? 0;
  }
  totalRaised = Math.floor(totalRaised / 100);

  // Build display name
  const displayName = profile.isOrganization && profile.organization?.name
    ? profile.organization.name
    : profile.name;

  // Build initials for avatar fallback
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch campaign images
  const campaignToPatientPhotoId = new Map<string, string>();
  const campaignToFirstDocImageId = new Map<string, string>();

  for (const c of campaigns) {
    const campaignId = String(c._id);
    if (c.patient?.photoAssetId) {
      campaignToPatientPhotoId.set(campaignId, String(c.patient.photoAssetId));
    }
    const firstImageDoc = (c.documents || []).find((d) => d.type?.startsWith("image/"));
    if (firstImageDoc?.assetId) {
      campaignToFirstDocImageId.set(campaignId, String(firstImageDoc.assetId));
    }
  }

  const allAssetIds = [
    ...Array.from(campaignToPatientPhotoId.values()),
    ...Array.from(campaignToFirstDocImageId.values()),
  ];
  const uniqueAssetIds = Array.from(new Set(allAssetIds));

  const assets = uniqueAssetIds.length > 0
    ? await mediaAssetService.listByIds(uniqueAssetIds.map((assetId) => new mongoose.Types.ObjectId(assetId)))
    : [];

  const assetIdToImage = new Map<string, string>();
  for (const a of assets) {
    const key = a.storage?.key;
    if (key) {
      const src = CloudinaryService.generateTransformationUrl(key, {
        width: 768,
        crop: "fill",
        gravity: "auto",
        aspect_ratio: "16:9",
        fetch_format: "auto",
        quality: "auto",
      });
      assetIdToImage.set(String(a._id), src);
    } else if (a.url) {
      assetIdToImage.set(String(a._id), a.url);
    }
  }

  // Transform campaigns to display format
  const campaignItems = campaigns.map((c) => {
    const campaignId = String(c._id);
    const raisedMinor = c.totals?.raisedMinor ?? 0;
    const goalMinor = c.goal?.amountMinor ?? 0;
    const currency = c.goal?.currency || "SLE";
    const titleBase = c.patient?.name?.trim() || c.hospital?.name?.trim() || c.diagnosis?.trim() || c.slug;

    const patientPhotoId = campaignToPatientPhotoId.get(campaignId);
    const docImageId = campaignToFirstDocImageId.get(campaignId);
    const imageUrl = patientPhotoId
      ? assetIdToImage.get(patientPhotoId) || "/assets/Hero.png"
      : docImageId
        ? assetIdToImage.get(docImageId) || "/assets/Hero.png"
        : "/assets/Hero.png";

    return {
      id: campaignId,
      slug: c.slug,
      title: titleBase,
      currency,
      amountRaised: Math.max(0, Math.floor(raisedMinor) / 100),
      goalAmount: Math.max(0, Math.floor(goalMinor) / 100),
      donationsCount: c.totals?.donationCount ?? 0,
      imageUrl,
      verified: c.verification?.status === "approved",
    };
  });

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20">
      <main className="py-8 md:py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Profile Header Card */}
          <Card className="rounded-3xl border border-border/50 shadow-xl mb-8">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-24 w-24">
                  {profile.photoUrl ? (
                    <AvatarImage src={profile.photoUrl} alt={displayName} />
                  ) : (
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {profile.isOrganization && profile.organization?.type && (
                    <Badge variant="secondary" className="mt-2">
                      <Building2 className="h-3 w-3 mr-1" />
                      {profile.organization.type === "ngo" ? "NGO" : "Charity"}
                    </Badge>
                  )}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {formatDate(profile.memberSince)}
                    </span>
                    {profile.organization?.website && (
                      <a
                        href={profile.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>
                  {profile.organization?.description && (
                    <p className="mt-4 text-muted-foreground max-w-2xl">
                      {profile.organization.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="rounded-2xl border border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">Campaign{campaigns.length === 1 ? "" : "s"}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{formatAmount(totalRaised)}</p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  <Heart className="h-5 w-5" />
                  {totalSupporters}
                </p>
                <p className="text-sm text-muted-foreground">Supporter{totalSupporters === 1 ? "" : "s"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Section */}
          <h2 className="text-xl font-semibold mb-6">
            Campaigns by {displayName}
          </h2>

          {campaignItems.length === 0 ? (
            <Card className="rounded-2xl border border-border/50">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No public campaigns yet.</p>
              </CardContent>
            </Card>
          ) : (
            <CreatorCampaignsGrid campaigns={campaignItems} />
          )}

          {/* Back Link */}
          <div className="mt-10 text-center text-sm">
            <Link href="/campaigns" className="text-blaze-orange hover:text-primary">
              &larr; Back to all campaigns
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
