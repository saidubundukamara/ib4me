import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authConfig } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import { donationRepository } from "@/repositories/DonationRepository";
import { campaignRepository } from "@/repositories/CampaignRepository";
import DonationsUI from "../_components/DonationsUI";

export const dynamic = "force-dynamic";

export default async function UserDonationsPage() {
  await connectDB();
  const session: Session | null = await getServerSession(authConfig);

  const userId = session?.user?.id
    ? new mongoose.Types.ObjectId(session.user.id)
    : null;

  const userCampaigns = userId
    ? await campaignRepository.findMany({ ownerId: userId } as never)
    : [];

  const campaignIds = userCampaigns.map(
    (c) => c._id as mongoose.Types.ObjectId,
  );

  const succeededDonations =
    campaignIds.length > 0
      ? await donationRepository.listSucceededByCampaignIds(campaignIds)
      : [];

  const userDonationsMadeRaw = userId
    ? await donationRepository.findMany({ donorId: userId } as never)
    : [];

  const campaignIdToMeta = new Map<string, { title: string; slug?: string }>();
  for (const c of userCampaigns) {
    const title = c.beneficiary?.name || c.details || c.slug;
    campaignIdToMeta.set(String(c._id), { title, slug: c.slug });
  }

  const primaryCurrency =
    succeededDonations[0]?.amount.currency ??
    userDonationsMadeRaw?.[0]?.amount.currency ??
    "LE";

  // Source "Total Raised" stats from campaign.totals — the single source of
  // truth used everywhere else (campaign cards, dashboard, admin). This is the
  // net amount the campaign receives (campaignReceivesMinor) and includes
  // payment_received donations, so it stays aligned with the campaign "Raised".
  const totalRaisedMinor = userCampaigns.reduce(
    (sum, c) => sum + (c.totals?.raisedMinor ?? 0),
    0,
  );
  const totalRaised = totalRaisedMinor / 100;
  const donationCount = userCampaigns.reduce(
    (sum, c) => sum + (c.totals?.donationCount ?? 0),
    0,
  );
  const averageDonationMinor = donationCount
    ? Math.round(totalRaisedMinor / donationCount)
    : 0;
  const avgDonation = averageDonationMinor / 100;

  const now = new Date();
  const monthTotals: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const total = succeededDonations.reduce((sum, d) => {
      const dKey = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
      return dKey === key ? sum + d.amount.minor : sum;
    }, 0);
    monthTotals.push(total);
  }
  const maxMinor = Math.max(1, ...monthTotals);
  const avgPct = Math.min(
    100,
    Math.round((averageDonationMinor / Math.max(1, maxMinor)) * 100),
  );

  const uniqueReceivingCampaigns = userCampaigns.filter(
    (c) => (c.totals?.donationCount ?? 0) > 0,
  ).length;

  const donationsReceived = succeededDonations.slice(0, 20).map((d) => ({
    id: String(d._id),
    campaignTitle:
      campaignIdToMeta.get(String(d.campaignId))?.title ?? "Unknown campaign",
    date: new Date(d.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    donorName: d.donorSnapshot?.name,
    status: d.status,
    amountMinor: d.campaignReceivesMinor ?? d.amount.minor,
    currency: d.amount.currency ?? primaryCurrency,
  }));

  const userDonationsMade = userDonationsMadeRaw.filter(
    (d) => d.status === "succeeded",
  );

  const madeCampaignIds = userDonationsMade.map(
    (d) => d.campaignId as mongoose.Types.ObjectId,
  );
  const madeCampaigns =
    madeCampaignIds.length > 0
      ? await campaignRepository.findMany({
          _id: { $in: madeCampaignIds },
        } as never)
      : [];
  const madeCampaignIdToMeta = new Map<
    string,
    { title: string; slug?: string }
  >();
  for (const c of madeCampaigns) {
    const title = c.beneficiary?.name || c.details || c.slug;
    madeCampaignIdToMeta.set(String(c._id), { title, slug: c.slug });
  }

  const totalDonatedMinorMade = userDonationsMade.reduce(
    (sum, d) => sum + (d.amount?.minor ?? 0),
    0,
  );
  const totalDonated = totalDonatedMinorMade / 100;
  const campaignsSupported = new Set(
    userDonationsMade.map((d) => String(d.campaignId)),
  ).size;

  const donationsMade = userDonationsMade.slice(0, 20).map((d) => {
    const meta = madeCampaignIdToMeta.get(String(d.campaignId));
    return {
      id: String(d._id),
      campaignTitle: meta?.title ?? "Unknown campaign",
      slug: meta?.slug,
      date: new Date(d.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: d.status,
      amountMinor: d.amount.minor,
      currency: d.amount.currency ?? primaryCurrency,
    };
  });

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
    ...succeededDonations.map((d) => [
      new Date(d.createdAt).toISOString(),
      String((d.campaignReceivesMinor ?? d.amount.minor) / 100),
      d.amount.currency,
      campaignIdToMeta.get(String(d.campaignId))?.title ??
        String(d.campaignId),
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
    <DonationsUI
      totalRaised={totalRaised}
      donationCount={donationCount}
      avgDonation={avgDonation}
      uniqueCampaigns={uniqueReceivingCampaigns}
      donationsReceived={donationsReceived}
      totalDonated={totalDonated}
      campaignsSupported={campaignsSupported}
      donationsMade={donationsMade}
      csvHref={csvHref}
      avgPct={avgPct}
      primaryCurrency={primaryCurrency}
    />
  );
}
