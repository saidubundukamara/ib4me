import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";
import { payoutRepository } from "@/repositories/PayoutRepository";

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

export default async function UserWithdrawalsPage() {
  await connectDB();
  const session: Session | null = await getServerSession(authConfig);
  const userId = session?.user?.id
    ? new mongoose.Types.ObjectId(session.user.id)
    : null;

  const campaigns = userId ? await campaignService.listByOwner(userId) : [];
  const campaignOptions = campaigns.map((c) => {
    const raised = c.totals?.raisedMinor ?? 0;
    const paid = c.withdrawals?.totalPaidMinor ?? 0;
    const available = Math.max(0, raised - paid);
    const currency = c.goal?.currency ?? "USD";
    const title = c.patient?.name || c.diagnosis || c.slug;
    return {
      id: String(c._id),
      title,
      currency,
      availableMinor: available,
    };
  });

  const campaignIds = campaigns.map((c) => c._id as mongoose.Types.ObjectId);
  const payouts = campaignIds.length
    ? await payoutRepository.listRecentByCampaignIds(campaignIds, 20)
    : [];

  async function requestPayout(formData: FormData) {
    "use server";
    await connectDB();
    const sessionInner: Session | null = await getServerSession(authConfig);
    const userIdInner = sessionInner?.user?.id
      ? new mongoose.Types.ObjectId(sessionInner.user.id)
      : null;
    if (!userIdInner) throw new Error("Not authenticated");

    const campaignIdStr = String(formData.get("campaignId") || "");
    const amountStr = String(formData.get("amount") || "0");
    const msisdn = String(formData.get("msisdn") || "");

    if (!campaignIdStr) throw new Error("Campaign is required");
    
    // Fetch the campaign data within the server action to avoid closure issues
    const userCampaigns = await campaignService.listByOwner(userIdInner);
    const campaign = userCampaigns.find((c) => String(c._id) === campaignIdStr);
    if (!campaign) throw new Error("Invalid campaign selected");
    const raised = campaign.totals?.raisedMinor ?? 0;
    const paid = campaign.withdrawals?.totalPaidMinor ?? 0;
    const availableMinor = Math.max(0, raised - paid);

    const amountMinor = Math.round(Number(amountStr) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0)
      throw new Error("Invalid amount");
    if (amountMinor > availableMinor)
      throw new Error("Amount exceeds available balance");
    if (!msisdn || !/^\d{7,15}$/.test(msisdn))
      throw new Error("Enter a valid mobile number");

    await payoutService.requestPayout({
      campaignId: new mongoose.Types.ObjectId(campaignIdStr),
      requestedBy: userIdInner,
      amountMinor,
      method: {
        type: "mobile_money",
        msisdn,
      },
    });

    revalidatePath("/user/withdrawals");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold">Withdrawals</h2>
        <p className="text-sm text-gray-600 mt-1">Request and track payouts from your campaign funds.</p>
      </div>

      <form action={requestPayout} className="space-y-4 rounded-2xl border p-4 bg-white/80 dark:bg-white/5">
        <div>
          <label className="text-sm">Select Campaign</label>
          <select name="campaignId" required className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5">
            {campaignOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} • Available {formatCurrency(c.availableMinor, c.currency)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Amount</label>
            <input name="amount" required type="number" step="0.01" min="0.01" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="200"/>
          </div>
          <div>
            <label className="text-sm">Mobile Number</label>
            <input name="msisdn" required type="tel" inputMode="tel" pattern="^\d{7,15}$" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/5" placeholder="Enter digits only"/>
          </div>
        </div>
        <button className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700 transition">Request Payout</button>
      </form>

      <div className="rounded-2xl border p-4 bg-white/80 dark:bg-white/5">
        <h3 className="font-medium">Recent Payouts</h3>
        <div className="mt-3 divide-y text-sm">
          {payouts.length === 0 && (
            <div className="py-3 text-gray-500">No payout requests yet.</div>
          )}
          {payouts.map((p) => {
            const campaign = campaigns.find((c) => String(c._id) === String(p.campaignId));
            const currency = campaign?.goal?.currency ?? "USD";
            const title = campaign?.patient?.name || campaign?.diagnosis || campaign?.slug || "Campaign";
            const statusColor =
              p.status === "paid"
                ? "text-emerald-600"
                : p.status === "rejected"
                ? "text-rose-600"
                : p.status === "approved"
                ? "text-amber-600"
                : "text-gray-500";
            return (
              <div key={String(p._id)} className="py-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{title}</span>
                  <span className="text-gray-500">{new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={statusColor}>{p.status.replace("_", " ")}</span>
                  <span className="text-gray-700">{formatCurrency(p.amountMinor, currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


