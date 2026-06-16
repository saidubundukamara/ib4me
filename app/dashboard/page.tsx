import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { donationRepository } from "@/repositories/DonationRepository";
import Card from "./_components/Card";
import ProgressBar from "./_components/ProgressBar";
import { DollarSign, Heart, Users, TrendingUp, MoreVertical, Eye, Pencil, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function formatCurrency(minor: number, currency: string): string {
  const value = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default async function UserDashboardPage() {
  await connectDB();
  const session = await getServerSession(authConfig);

  const userId = session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : null;

  const campaigns = userId ? await campaignService.listByOwner(userId) : [];
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  const campaignIds = campaigns.map((c) => c._id as mongoose.Types.ObjectId);
  const donations = campaignIds.length
    ? await donationRepository.listSucceededByCampaignIds(campaignIds)
    : [];

  const currency = campaigns[0]?.goal?.currency ?? "SLE";

  const totalRaisedMinor = campaigns.reduce((sum, c) => sum + (c.totals?.raisedMinor ?? 0), 0);
  const totalDonations = campaigns.reduce((sum, c) => sum + (c.totals?.donationCount ?? 0), 0);
  const campaignsSupported = donations.length;
  const avgDonationMinor = donations.length ? Math.round(donations.reduce((sum, d) => sum + (d.campaignReceivesMinor ?? d.amount.minor), 0) / donations.length) : 0;

  const averageProgressPct = (() => {
    const progressValues = campaigns
      .map((c) => {
        const raised = c.totals?.raisedMinor ?? 0;
        const goal = c.goal?.amountMinor ?? 0;
        if (!goal) return null;
        return Math.min(100, Math.round((raised / goal) * 100));
      })
      .filter((v): v is number => v !== null);
    if (progressValues.length === 0) return 0;
    return Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length);
  })();

  const uniqueDonorCount = (() => {
    const ids = new Set<string>();
    for (const d of donations) {
      if (d.donorId) ids.add(String(d.donorId));
      else if (d.donorSnapshot?.email) ids.add(d.donorSnapshot.email.toLowerCase());
    }
    return ids.size;
  })();

  // Last 6 months trend (including current month)
  const now = new Date();
  const months: { key: string; label: string; totalMinor: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const label = dt.toLocaleDateString(undefined, { month: "short" });
    months.push({ key, label, totalMinor: 0 });
  }
  for (const d of donations) {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.totalMinor += d.campaignReceivesMinor ?? d.amount.minor;
  }
  const maxMinor = Math.max(1, ...months.map((m) => m.totalMinor));

  const recentDonations = campaignIds.length
    ? await donationRepository.listRecentSucceededByCampaignIds(campaignIds, 6)
    : [];

  const campaignTitleMap = new Map(
    campaigns.map((c) => [
      String(c._id),
      c.beneficiary?.name || c.details || c.slug,
    ])
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your campaigns and donations.</p>
      </div>

      {/* Stats Grid (responsive, wraps cleanly) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-muted-foreground">Total Raised</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {formatCurrency(totalRaisedMinor, currency)}
              </div>
              <div className="text-[11px] sm:text-xs text-muted-foreground">{totalDonations} total donations</div>
            </div>
          </div>

          <div className="mt-4">
            <div
              className="h-20 sm:h-24 w-full rounded-xl bg-muted grid grid-cols-6 items-end gap-2 p-2"
              role="img"
              aria-label="Monthly raised totals bar chart"
            >
              {months.map((m, idx) => {
                const pct = Math.round((m.totalMinor / maxMinor) * 100);
                const isKeyTick = idx === 0 || idx === Math.floor(months.length / 2) || idx === months.length - 1;
                return (
                  <div key={m.key} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md bg-primary/30"
                      style={{ height: `${Math.max(6, pct)}%` }}
                      aria-label={`${m.label} ${pct}% of max`}
                    />
                    <span className={`text-[10px] text-muted-foreground ${isKeyTick ? 'block' : 'hidden md:block'}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blaze-orange/10 rounded-full flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-blaze-orange" aria-hidden />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Campaigns</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{activeCampaigns.length}</div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={averageProgressPct} className="w-full" aria-label="Average campaign progress" />
            <div className="mt-2 text-[11px] sm:text-xs text-muted-foreground">{averageProgressPct}% average progress</div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-chartereuse/10 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-chartereuse-dark" aria-hidden />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Unique Donors</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{uniqueDonorCount}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-1 sm:gap-2">
            {months.map((m) => (
              <div key={m.key} className="h-6 sm:h-8 rounded-lg bg-muted" />
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-blaze/10 rounded-full flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-orange-blaze" aria-hidden />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Donations</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{totalDonations}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-success/10 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-success" aria-hidden />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Avg. Donation</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(avgDonationMinor, currency)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blaze-orange/10 rounded-full flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-blaze-orange" aria-hidden />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">Campaigns Supported</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{campaignsSupported}</div>
            </div>
          </div>

          <div className="mt-3 sm:mt-4">
            <ProgressBar value={averageProgressPct} className="w-full" aria-label="Average progress" />
            <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
              {averageProgressPct}% average progress
            </div>
          </div>
        </Card>
      </div>

      {/* Your Campaigns */}
      <Card className="p-8 rounded-3xl border-0 shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Your Campaigns</h2>
          <Link href="/dashboard/campaigns" className="text-sm text-primary">View all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.slice(0, 6).map((c) => {
            const raised = c.totals?.raisedMinor ?? 0;
            const goalMinor = c.goal?.amountMinor ?? 0;
            const progress = goalMinor ? Math.min(100, Math.round((raised / goalMinor) * 100)) : 0;
            const title = c.beneficiary?.name || c.details || c.slug;
            const campaignId = String(c._id);
            return (
              <Card key={campaignId} className="p-4 rounded-2xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-primary" />
                  </div>
                  <div className="font-medium text-sm truncate flex-1" title={title}>{title}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Campaign actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/campaigns/${c.slug}`} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" /> View Campaign
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/campaigns/${campaignId}`} className="flex items-center gap-2">
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/donations?campaign=${campaignId}`} className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> View Donations
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Support this campaign: ${process.env.NEXT_PUBLIC_SITE_URL || "https://ib4me.org"}/campaigns/${c.slug}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Share2 className="h-4 w-4" /> Share
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <ProgressBar value={progress} className="w-full mb-2" />
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{progress}%</span>
                  <span>
                    {formatCurrency(raised, c.goal?.currency ?? currency)} / {goalMinor ? formatCurrency(goalMinor, c.goal?.currency ?? currency) : "No goal"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Recent Donations */}
      <Card className="p-8 rounded-3xl border-0 shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Recent Donations</h2>
          <a href="/dashboard/donations" className="text-sm text-primary">View all</a>
        </div>
        <div className="space-y-4">
          {recentDonations.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No recent donations yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Share your campaigns to start receiving donations.
              </p>
              <Link
                href="/dashboard/campaigns"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
              >
                View Campaigns
              </Link>
            </div>
          ) : (
            recentDonations.map((d) => {
              const donorName = d.isAnonymous ? "Anonymous" : (d.donorSnapshot?.name || "A supporter");
              const campaignTitle = campaignTitleMap.get(String(d.campaignId)) || "your campaign";
              return (
                <div key={String(d._id)} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blaze-orange/10 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-blaze-orange" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{donorName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        donated to <span className="text-foreground font-medium">{campaignTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-blaze-orange">{formatCurrency(d.campaignReceivesMinor ?? d.amount.minor, d.amount.currency)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
