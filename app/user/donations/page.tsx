import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { donationRepository } from "@/repositories/DonationRepository";
import { campaignRepository } from "@/repositories/CampaignRepository";
import Card from "../_components/Card";
import ProgressBar from "../_components/ProgressBar";

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

export default async function UserDonationsPage() {
  await connectDB();
  const session: Session | null = await getServerSession(authConfig);

  const userId = session?.user?.id
    ? new mongoose.Types.ObjectId(session.user.id)
    : null;

  const donations = userId
    ? await donationRepository.listSucceededByDonor(userId)
    : [];

  // Collect campaign titles for display
  const campaignIds = Array.from(
    new Set(
      donations
        .map((d) => d.campaignId)
        .filter((id): id is mongoose.Types.ObjectId => Boolean(id))
    )
  );

  const campaigns = campaignIds.length
    ? await campaignRepository.findMany({ _id: { $in: campaignIds } } as never)
    : [];
  const campaignIdToTitle = new Map<string, string>();
  for (const c of campaigns) {
    const title = c.patient?.name || c.diagnosis || c.slug;
    campaignIdToTitle.set(String(c._id), title);
  }

  const primaryCurrency = donations[0]?.amount.currency ?? "USD";
  const totalDonatedMinor = donations.reduce(
    (sum, d) => sum + (d.amount?.minor ?? 0),
    0
  );
  const donationCount = donations.length;
  const averageDonationMinor = donationCount
    ? Math.round(totalDonatedMinor / donationCount)
    : 0;

  // Last 6 months trend
  const now = new Date();
  const months: { key: string; label: string; totalMinor: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = dt.toLocaleDateString(undefined, { month: "short" });
    months.push({ key, label, totalMinor: 0 });
  }
  for (const d of donations) {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.totalMinor += d.amount.minor;
  }
  const maxMinor = Math.max(1, ...months.map((m) => m.totalMinor));

  // Export CSV data URL
  const csvRows = [
    [
      "Date",
      "Amount",
      "Currency",
      "Campaign",
      "Status",
      "Donor Name",
      "Donor Email",
    ],
    ...donations.map((d) => [
      new Date(d.createdAt).toISOString(),
      String(d.amount.minor / 100),
      d.amount.currency,
      campaignIdToTitle.get(String(d.campaignId)) ?? String(d.campaignId),
      d.status,
      d.donorSnapshot?.name ?? "",
      d.donorSnapshot?.email ?? "",
    ]),
  ];
  const csvContent = csvRows
    .map((r) => r.map((v) => `"${String(v).replaceAll("\"", '""')}"`).join(","))
    .join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Donations</h2>
        <p className="text-sm text-gray-600 mt-1">
          Track your donations, analytics, and download your records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card gradient className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm/5 opacity-90">Total Donated</p>
              <p className="text-3xl font-semibold mt-1">
                {formatCurrency(totalDonatedMinor, primaryCurrency)}
              </p>
              <p className="text-xs mt-1 opacity-90">{donationCount} donations</p>
            </div>
            <span className="rounded-full bg-white/20 px-2 py-1 text-xs">
              Last 6 months
            </span>
          </div>
          <div className="mt-4">
            <div className="h-24 w-full rounded-xl bg-white/10 grid grid-cols-6 items-end gap-2 p-2">
              {months.map((m) => {
                const pct = Math.round((m.totalMinor / maxMinor) * 100);
                return (
                  <div key={m.key} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md bg-white/70 dark:bg-white/30"
                      style={{ height: `${Math.max(6, pct)}%` }}
                    />
                    <span className="text-[10px] opacity-80">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">Average Donation</p>
          <p className="text-3xl font-semibold mt-2">
            {formatCurrency(averageDonationMinor, primaryCurrency)}
          </p>
          <div className="mt-4">
            <ProgressBar value={Math.min(100, Math.round((averageDonationMinor / Math.max(1, maxMinor)) * 100))} />
            <div className="mt-2 text-xs text-gray-500">
              Relative to your monthly peak
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">Campaigns Supported</p>
          <p className="text-3xl font-semibold mt-2">{campaignIds.length}</p>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {months.map((m) => (
              <div
                key={m.key}
                className="h-8 rounded-lg bg-gray-100/70 dark:bg-white/10"
              />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Recent Donations</h3>
          <a href={csvHref} download="donations.csv" className="text-sm text-indigo-600">
            Export CSV
          </a>
        </div>
        <div className="mt-3 divide-y">
          {donations.length === 0 && (
            <div className="py-3 text-sm text-gray-500">
              You have not made any donations yet.
            </div>
          )}
          {donations.slice(0, 20).map((d) => {
            const title = campaignIdToTitle.get(String(d.campaignId)) ?? "Unknown campaign";
            const statusColor =
              d.status === "succeeded"
                ? "bg-emerald-500"
                : d.status === "pending"
                ? "bg-amber-500"
                : "bg-rose-500";
            return (
              <div key={String(d._id)} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                  <div className="flex flex-col">
                    <span className="text-gray-800 dark:text-gray-100 font-medium">
                      {title}
                    </span>
                    <span className="text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-gray-700 dark:text-gray-200">
                  {formatCurrency(d.amount.minor, d.amount.currency)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}


