import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import { MapPin, Calendar, Globe, Building2, Heart, Award, Users, TrendingUp, HandHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { userService, campaignService, mediaAssetService } from "@/services";
import { CloudinaryService } from "@/lib/cloudinary";
import { getOGImageFromCampaigns, buildPageMetadata } from "@/lib/metadata";
import { slugToTitle } from "@/lib/utils";
import CreatorCampaignsGrid from "./CreatorCampaignsGrid";
import { formatMajor } from "@/lib/currency";

type PageParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { title: "Creator Not Found" };
  }

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

  let totalRaised = 0;
  let totalSupporters = 0;
  for (const c of campaigns) {
    totalRaised += c.totals?.raisedMinor ?? 0;
    totalSupporters += c.totals?.donationCount ?? 0;
  }
  totalRaised = Math.floor(totalRaised / 100);

  const displayName = profile.isOrganization && profile.organization?.name
    ? profile.organization.name
    : profile.name;

  const initials = displayName
    .split(/\s+/)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch campaign images
  const campaignToBeneficiaryPhotoId = new Map<string, string>();
  const campaignToFirstDocImageId = new Map<string, string>();

  for (const c of campaigns) {
    const campaignId = String(c._id);
    if (c.beneficiary?.photoAssetId) {
      campaignToBeneficiaryPhotoId.set(campaignId, String(c.beneficiary.photoAssetId));
    }
    const firstImageDoc = (c.documents || []).find((d) => d.type?.startsWith("image/"));
    if (firstImageDoc?.assetId) {
      campaignToFirstDocImageId.set(campaignId, String(firstImageDoc.assetId));
    }
  }

  const allAssetIds = [
    ...Array.from(campaignToBeneficiaryPhotoId.values()),
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

  const campaignItems = campaigns.map((c) => {
    const campaignId = String(c._id);
    const raisedMinor = c.totals?.raisedMinor ?? 0;
    const goalMinor = c.goal?.amountMinor ?? 0;
    const currency = c.goal?.currency || "SLE";
    const titleBase = c.title?.trim() || slugToTitle(c.slug);
    const storyText = c.story;

    const beneficiaryPhotoId = campaignToBeneficiaryPhotoId.get(campaignId);
    const docImageId = campaignToFirstDocImageId.get(campaignId);
    const imageUrl = beneficiaryPhotoId
      ? assetIdToImage.get(beneficiaryPhotoId) || "/assets/campaignplaceholderimage.png"
      : docImageId
        ? assetIdToImage.get(docImageId) || "/assets/campaignplaceholderimage.png"
        : "/assets/campaignplaceholderimage.png";

    return {
      id: campaignId,
      slug: c.slug,
      title: titleBase,
      description: storyText ? storyText.replace(/<[^>]+>/g, "").slice(0, 160).trim() || undefined : undefined,
      currency,
      amountRaised: Math.max(0, raisedMinor) / 100,
      goalAmount: Math.max(0, goalMinor) / 100,
      donationsCount: c.totals?.donationCount ?? 0,
      imageUrl,
      verified: c.verification?.status === "approved",
      ownerVerified: c.ownerVerification?.verified ?? false,
      category: c.category || undefined,
      urgency: (c.urgency as "low" | "medium" | "high" | undefined) || undefined,
    };
  });

  const isOrg = profile.isOrganization && profile.organization;

  // Pick the most-funded active campaign for the donate CTA
  const topCampaign = campaignItems.length > 0
    ? campaignItems.reduce((best, c) => {
        const pct = c.goalAmount > 0 ? c.amountRaised / c.goalAmount : 0;
        const bestPct = best.goalAmount > 0 ? best.amountRaised / best.goalAmount : 0;
        return pct > bestPct ? c : best;
      })
    : null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/20 font-Sora">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-chartereuse-dark h-40 sm:h-52">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        </div>
      </div>

      <main className="pb-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Profile card overlapping the banner */}
          <div className="-mt-16 sm:-mt-20 relative z-10">
            <Card className="rounded-3xl border border-border/50 shadow-2xl bg-card">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start">
                  {/* Avatar */}
                  <div className="shrink-0 -mt-1 sm:-mt-4">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-4 border-card shadow-xl bg-muted ring-2 ring-primary/20">
                      {profile.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.photoUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                          <span className="text-2xl sm:text-3xl font-bold text-primary">{initials}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                          {displayName}
                        </h1>
                        {isOrg && profile.organization?.type && (
                          <Badge variant="secondary" className="mt-2 gap-1">
                            <Building2 className="h-3 w-3" />
                            {profile.organization.type === "ngo" ? "NGO" : "Charity"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                      {profile.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                          {profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        Member since {formatDate(profile.memberSince)}
                      </span>
                      {profile.organization?.website && (
                        <a
                          href={profile.organization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                          Website
                        </a>
                      )}
                    </div>

                    {isOrg && profile.organization?.description && (
                      <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
                        {profile.organization.description}
                      </p>
                    )}
                    {!isOrg && profile.bio && (
                      <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {profile.bio}
                      </p>
                    )}

                    {topCampaign && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button asChild size="sm" className="gap-2 rounded-xl shadow-sm">
                          <Link href={`/campaigns/${topCampaign.slug}/donate`}>
                            <HandHeart className="h-4 w-4" />
                            Donate to a Campaign
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
                          <Link href={`/campaigns/${topCampaign.slug}`}>
                            View Campaign
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            <Card className="rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-5 text-center">
                <div className="flex justify-center mb-1.5 sm:mb-2">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-primary">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Campaign{campaigns.length === 1 ? "" : "s"}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-5 text-center">
                <div className="flex justify-center mb-1.5 sm:mb-2">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-sm sm:text-xl font-bold text-primary leading-tight break-all">{formatMajor(totalRaised)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Raised</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-border/50 bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-5 text-center">
                <div className="flex justify-center mb-1.5 sm:mb-2">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-primary">{totalSupporters}</p>
                <p className="text-xs text-muted-foreground mt-1">Supporter{totalSupporters === 1 ? "" : "s"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Campaigns by <span className="text-primary">{displayName}</span>
              </h2>
              {campaignItems.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {campaignItems.length} campaign{campaignItems.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {campaignItems.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-border/60">
                <CardContent className="p-10 text-center">
                  <Heart className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No public campaigns yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <CreatorCampaignsGrid campaigns={campaignItems} />
            )}
          </div>

          {/* Back link */}
          <div className="mt-10 text-center text-sm">
            <Link href="/campaigns" className="text-blaze-orange hover:text-primary transition-colors">
              &larr; Back to all campaigns
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
