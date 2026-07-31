import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { donationRepository } from "@/repositories/DonationRepository";
import Card from "./_components/Card";
import ProgressBar from "./_components/ProgressBar";
import { Heart, Banknote, MoreVertical, Eye, Pencil, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatMinor } from "@/lib/currency";


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
  const campaignsSupported = new Set(donations.map((d) => String(d.campaignId))).size;
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

  // Monthly unique donor counts — derived from the same donations already fetched
  const monthlyDonorSets: Map<string, Set<string>> = new Map(
    months.map((m) => [m.key, new Set()])
  );
  for (const d of donations) {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const set = monthlyDonorSets.get(key);
    if (set) {
      if (d.donorId) set.add(String(d.donorId));
      else if (d.donorSnapshot?.email) set.add(d.donorSnapshot.email.toLowerCase());
    }
  }
  const monthlyUniqueDonors = months.map((m) => ({
    ...m,
    count: monthlyDonorSets.get(m.key)?.size ?? 0,
  }));
  const maxUniqueDonors = Math.max(1, ...monthlyUniqueDonors.map((m) => m.count));

  // Monthly donation counts (for Total Donations card)
  const monthlyCountMap = new Map<string, number>(months.map((m) => [m.key, 0]));
  for (const d of donations) {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyCountMap.has(key)) monthlyCountMap.set(key, (monthlyCountMap.get(key) ?? 0) + 1);
  }
  const monthlyDonationCounts = months.map((m) => ({ ...m, count: monthlyCountMap.get(m.key) ?? 0 }));
  const maxDonationCount = Math.max(1, ...monthlyDonationCounts.map((m) => m.count));

  // Monthly average donation amount (for Avg. Donation card)
  const monthlyAvgBuckets = new Map<string, { sum: number; count: number }>(
    months.map((m) => [m.key, { sum: 0, count: 0 }])
  );
  for (const d of donations) {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyAvgBuckets.get(key);
    if (bucket) { bucket.sum += d.campaignReceivesMinor ?? d.amount.minor; bucket.count += 1; }
  }
  const monthlyAvgDonations = months.map((m) => {
    const b = monthlyAvgBuckets.get(m.key)!;
    return { ...m, avgMinor: b.count ? Math.round(b.sum / b.count) : 0 };
  });
  const maxAvgMinor = Math.max(1, ...monthlyAvgDonations.map((m) => m.avgMinor));

  // Monthly unique campaigns with at least one donation (for Campaigns Supported card)
  const monthlyCampaignSets = new Map<string, Set<string>>(months.map((m) => [m.key, new Set()]));
  for (const d of donations) {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    monthlyCampaignSets.get(key)?.add(String(d.campaignId));
  }
  const monthlyCampaignActivity = months.map((m) => ({ ...m, count: monthlyCampaignSets.get(m.key)?.size ?? 0 }));
  const maxCampaignActivity = Math.max(1, ...monthlyCampaignActivity.map((m) => m.count));

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
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Raised</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {formatMinor(totalRaisedMinor, currency)}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{totalDonations} total donations</div>
          </div>

          <div className="mt-4">
            <div
              className="h-16 w-full rounded-xl bg-muted grid grid-cols-6 items-end gap-2 p-2"
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
          <div className="mb-3">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Active Campaigns</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{activeCampaigns.length}</div>
          </div>
          <div className="mb-3">
            <ProgressBar value={averageProgressPct} className="w-full" aria-label="Average campaign progress" />
            <div className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">{averageProgressPct}% average progress</div>
          </div>
          {activeCampaigns.length > 0 && (
            <div className="space-y-2.5 border-t border-border/40 pt-3">
              {activeCampaigns.slice(0, 3).map((c) => {
                const raised = c.totals?.raisedMinor ?? 0;
                const goal = c.goal?.amountMinor ?? 0;
                const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
                const name = c.beneficiary?.name || c.details || c.slug;
                return (
                  <div key={String(c._id)} className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] text-foreground font-medium truncate">{name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} className="h-1.5 w-full" aria-label={`${name} progress`} />
                  </div>
                );
              })}
              {activeCampaigns.length > 3 && (
                <p className="text-[11px] text-muted-foreground">+{activeCampaigns.length - 3} more</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Unique Donors</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground mb-4">{uniqueDonorCount}</div>
          <div
            className="h-16 w-full rounded-xl bg-muted grid grid-cols-6 items-end gap-1.5 p-2"
            role="img"
            aria-label="Monthly unique donors bar chart"
          >
            {monthlyUniqueDonors.map((m, idx) => {
              const pct = Math.round((m.count / maxUniqueDonors) * 100);
              const isKeyTick = idx === 0 || idx === Math.floor(monthlyUniqueDonors.length / 2) || idx === monthlyUniqueDonors.length - 1;
              return (
                <div key={m.key} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-fun-green/40"
                    style={{ height: `${Math.max(6, pct)}%` }}
                    aria-label={`${m.label}: ${m.count} donors`}
                  />
                  <span className={`text-[10px] text-muted-foreground ${isKeyTick ? "block" : "hidden md:block"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Total Donations — monthly count sparkline */}
        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Donations</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground mb-4">{totalDonations}</div>
          <div
            className="h-16 w-full rounded-xl bg-muted grid grid-cols-6 items-end gap-1.5 p-2"
            role="img"
            aria-label="Monthly donation count bar chart"
          >
            {monthlyDonationCounts.map((m, idx) => {
              const pct = Math.round((m.count / maxDonationCount) * 100);
              const isKeyTick = idx === 0 || idx === Math.floor(monthlyDonationCounts.length / 2) || idx === monthlyDonationCounts.length - 1;
              return (
                <div key={m.key} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-blaze-orange/40"
                    style={{ height: `${Math.max(6, pct)}%` }}
                    aria-label={`${m.label}: ${m.count} donations`}
                  />
                  <span className={`text-[10px] text-muted-foreground ${isKeyTick ? "block" : "hidden md:block"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Avg. Donation — monthly average sparkline */}
        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg. Donation</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground mb-4">{formatMinor(avgDonationMinor, currency)}</div>
          <div
            className="h-16 w-full rounded-xl bg-muted grid grid-cols-6 items-end gap-1.5 p-2"
            role="img"
            aria-label="Monthly average donation bar chart"
          >
            {monthlyAvgDonations.map((m, idx) => {
              const pct = Math.round((m.avgMinor / maxAvgMinor) * 100);
              const isKeyTick = idx === 0 || idx === Math.floor(monthlyAvgDonations.length / 2) || idx === monthlyAvgDonations.length - 1;
              return (
                <div key={m.key} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-chartereuse/60"
                    style={{ height: `${Math.max(6, pct)}%` }}
                    aria-label={`${m.label}: avg ${formatMinor(m.avgMinor, currency)}`}
                  />
                  <span className={`text-[10px] text-muted-foreground ${isKeyTick ? "block" : "hidden md:block"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Campaigns Supported — monthly active campaigns sparkline */}
        <Card className="p-4 sm:p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Campaigns Supported</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground mb-4">{campaignsSupported}</div>
          <div
            className="h-16 w-full rounded-xl bg-muted grid grid-cols-6 items-end gap-1.5 p-2"
            role="img"
            aria-label="Monthly campaigns with donations bar chart"
          >
            {monthlyCampaignActivity.map((m, idx) => {
              const pct = Math.round((m.count / maxCampaignActivity) * 100);
              const isKeyTick = idx === 0 || idx === Math.floor(monthlyCampaignActivity.length / 2) || idx === monthlyCampaignActivity.length - 1;
              return (
                <div key={m.key} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-primary/20"
                    style={{ height: `${Math.max(6, pct)}%` }}
                    aria-label={`${m.label}: ${m.count} campaigns`}
                  />
                  <span className={`text-[10px] text-muted-foreground ${isKeyTick ? "block" : "hidden md:block"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Your Campaigns */}
      <Card className="p-4 sm:p-8 rounded-3xl border-0 shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Your Campaigns</h2>
          <Link href="/dashboard/campaigns" className="text-sm text-primary">View all</Link>
        </div>
        {campaigns.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-sm font-medium text-foreground mb-1">No campaigns yet</p>
            <p className="text-xs text-muted-foreground mb-4">Start your first campaign and reach donors.</p>
            <Link
              href="/dashboard/campaigns"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Create your first campaign
            </Link>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.slice(0, 6).map((c) => {
            const raised = c.totals?.raisedMinor ?? 0;
            const goalMinor = c.goal?.amountMinor ?? 0;
            const progress = goalMinor ? Math.min(100, Math.round((raised / goalMinor) * 100)) : 0;
            const title = c.beneficiary?.name || c.details || c.slug;
            const campaignId = String(c._id);
            const status = (c.status as string | undefined) ?? "draft";
            const statusStyles: Record<string, string> = {
              active: "bg-primary/10 text-primary",
              paused: "bg-blaze-orange/10 text-blaze-orange",
              completed: "bg-chartereuse/20 text-fun-green",
              draft: "bg-muted text-muted-foreground",
              archived: "bg-muted text-muted-foreground",
            };
            const statusStyle = statusStyles[status] ?? statusStyles.draft;
            return (
              <Card key={campaignId} className="p-4 rounded-2xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all">
                {/* Title + status + dropdown */}
                <div className="flex items-start gap-2 mb-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm leading-snug truncate" title={title}>{title}</div>
                    <span className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full -mt-0.5">
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
                          <Banknote className="h-4 w-4" /> View Donations
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/campaigns/${c.slug}#share`} className="flex items-center gap-2">
                          <Share2 className="h-4 w-4" /> Share
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <ProgressBar value={progress} className="w-full mb-2" />

                {/* Raised amount + % — stacked to avoid overflow on narrow cards */}
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-blaze-orange truncate">
                      {formatMinor(raised, c.goal?.currency ?? currency)}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{progress}%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    of {goalMinor ? formatMinor(goalMinor, c.goal?.currency ?? currency) : "No goal set"}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Recent Donations */}
      <Card className="p-4 sm:p-8 rounded-3xl border-0 shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">Recent Donations</h2>
          <a href="/dashboard/donations" className="text-sm text-primary">View all</a>
        </div>
        <div className="space-y-4">
          {recentDonations.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
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
                    <div className="text-base font-bold text-blaze-orange">{formatMinor(d.campaignReceivesMinor ?? d.amount.minor, d.amount.currency)}</div>
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

