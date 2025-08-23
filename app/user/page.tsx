import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { donationRepository } from "@/repositories/DonationRepository";
import Card from "./_components/Card";
import ProgressBar from "./_components/ProgressBar";

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

  const currency = campaigns[0]?.goal?.currency ?? "USD";

  const totalRaisedMinor = campaigns.reduce((sum, c) => sum + (c.totals?.raisedMinor ?? 0), 0);
  const totalDonations = campaigns.reduce((sum, c) => sum + (c.totals?.donationCount ?? 0), 0);

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
    if (bucket) bucket.totalMinor += d.amount.minor;
  }
  const maxMinor = Math.max(1, ...months.map((m) => m.totalMinor));

  const recentDonations = campaignIds.length
    ? await donationRepository.listRecentSucceededByCampaignIds(campaignIds, 6)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Overview of your campaigns and donations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card gradient className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm/5 opacity-90">Total Raised</p>
              <p className="text-3xl font-semibold mt-1">{formatCurrency(totalRaisedMinor, currency)}</p>
              <p className="text-xs mt-1 opacity-90">{totalDonations} total donations</p>
            </div>
            <span className="rounded-full bg-white/20 px-2 py-1 text-xs">Last 6 months</span>
          </div>
          <div className="mt-4">
            <div className="h-24 w-full rounded-xl bg-white/10 grid grid-cols-6 items-end gap-2 p-2">
              {months.map((m) => {
                const pct = Math.round((m.totalMinor / maxMinor) * 100);
                return (
                  <div key={m.key} className="flex flex-col items-center gap-1">
                    <div className="w-full rounded-md bg-white/70 dark:bg-white/30" style={{ height: `${Math.max(6, pct)}%` }} />
                    <span className="text-[10px] opacity-80">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">Active Campaigns</p>
          <p className="text-3xl font-semibold mt-2">{activeCampaigns.length}</p>
          <div className="mt-4">
            <ProgressBar value={averageProgressPct} />
            <div className="mt-2 text-xs text-gray-500">{averageProgressPct}% average progress</div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">Unique Donors</p>
          <p className="text-3xl font-semibold mt-2">{uniqueDonorCount}</p>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {months.map((m) => (
              <div key={m.key} className="h-8 rounded-lg bg-gray-100/70 dark:bg-white/10" />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Campaigns</h3>
            <a href="/user/campaigns" className="text-sm text-indigo-600">View all</a>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {campaigns.slice(0, 6).map((c) => {
              const raised = c.totals?.raisedMinor ?? 0;
              const goalMinor = c.goal?.amountMinor ?? 0;
              const progress = goalMinor ? Math.min(100, Math.round((raised / goalMinor) * 100)) : 0;
              const title = c.patient?.name || c.diagnosis || c.slug;
              return (
                <div key={String(c._id)} className="rounded-xl border p-4 bg-white/70 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 grid place-items-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                    <div className="font-medium truncate" title={title}>{title}</div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={progress} />
                    <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                      <span>{progress}%</span>
                      <span>
                        {formatCurrency(raised, c.goal?.currency ?? currency)} / {goalMinor ? formatCurrency(goalMinor, c.goal?.currency ?? currency) : "No goal"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Recent Donations</h3>
            <a href="/user/donations" className="text-sm text-indigo-600">View all</a>
          </div>
          <ul className="mt-4 space-y-3">
            {recentDonations.length === 0 && (
              <li className="text-sm text-gray-500">No recent donations yet.</li>
            )}
            {recentDonations.map((d) => (
              <li key={String(d._id)} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-gray-700 dark:text-gray-200">
                    {formatCurrency(d.amount.minor, d.amount.currency)}
                  </span>
                </div>
                <span className="text-gray-500">
                  {new Date(d.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}


