import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { campaignService } from "@/services/CampaignService";
import { payoutService } from "@/services/PayoutService";
import { payoutRepository } from "@/repositories/PayoutRepository";
import { WithdrawalForm } from "./WithdrawalForm";

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

  async function requestPayout(formData: FormData): Promise<{success: boolean, error?: string}> {
    "use server";
    try {
      await connectDB();
      const sessionInner: Session | null = await getServerSession(authConfig);
      const userIdInner = sessionInner?.user?.id
        ? new mongoose.Types.ObjectId(sessionInner.user.id)
        : null;
      if (!userIdInner) return { success: false, error: "Not authenticated" };

      const campaignIdStr = String(formData.get("campaignId") || "");
      const amountStr = String(formData.get("amount") || "0");
      const payoutType = String(formData.get("payoutType") || "mobile_money");
      const msisdn = String(formData.get("msisdn") || "");
      const accountNumber = String(formData.get("accountNumber") || "");
      const accountName = String(formData.get("accountName") || "");
      const providerId = String(formData.get("providerId") || "");

      if (!campaignIdStr) return { success: false, error: "Please select a campaign" };
      
      // Fetch the campaign data within the server action to avoid closure issues
      const userCampaigns = await campaignService.listByOwner(userIdInner);
      const campaign = userCampaigns.find((c) => String(c._id) === campaignIdStr);
      if (!campaign) return { success: false, error: "Invalid campaign selected" };
      
      // Check if campaign has financial account
      if (!campaign.financial_account?.id) {
        return { success: false, error: "Campaign setup is incomplete. Please contact support to enable withdrawals." };
      }
      
      const raised = campaign.totals?.raisedMinor ?? 0;
      const paid = campaign.withdrawals?.totalPaidMinor ?? 0;
      const availableMinor = Math.max(0, raised - paid);

      const amountMinor = Math.round(Number(amountStr) * 100);
      if (!Number.isFinite(amountMinor) || amountMinor <= 0)
        return { success: false, error: "Please enter a valid amount" };
      //
      // if (amountMinor > availableMinor) {
      //   const available = (availableMinor / 100).toFixed(2);
      //   const currency = campaign.goal?.currency ?? "USD";
      //   return { success: false, error: `Insufficient funds. Available balance: ${currency} ${available}` };
      // }

      // Validate payout method based on type
      if (payoutType === "mobile_money") {
        if (!msisdn || !/^\d{7,15}$/.test(msisdn))
          return { success: false, error: "Please enter a valid mobile number (7-15 digits)" };
      } else if (payoutType === "bank") {
        if (!accountNumber || accountNumber.length < 5)
          return { success: false, error: "Please enter a valid account number" };
        if (!accountName || accountName.trim().length < 2)
          return { success: false, error: "Please enter a valid account holder name" };
        if (!providerId)
          return { success: false, error: "Please select a bank" };
      } else {
        return { success: false, error: "Invalid payout method selected" };
      }

      // Build method object based on type
      const method = payoutType === "mobile_money" 
        ? {
            type: "mobile_money" as const,
            msisdn,
            accountName: accountName || undefined,
          }
        : {
            type: "bank" as const,
            providerId,
            accountNumber,
            accountName,
          };

      await payoutService.requestPayout({
        campaignId: new mongoose.Types.ObjectId(campaignIdStr),
        requestedBy: userIdInner,
        amountMinor,
        method,
      });
      
      revalidatePath("/user/withdrawals");
      return { success: true };
      
    } catch (error) {
      console.error("Payout request error:", error);
      
      // More specific error messages for common failures
      if (error instanceof Error) {
        if (error.message.includes("financial account")) {
          return { success: false, error: "Campaign setup is incomplete. Please contact support to enable withdrawals." };
        } else if (error.message.includes("Insufficient funds")) {
          return { success: false, error: "Insufficient funds available for withdrawal" };
        } else if (error.message.includes("Payout failed")) {
          return { success: false, error: "Unable to process payout at this time. Please try again in a few minutes." };
        } else if (error.message.includes("NETWORK_ERROR")) {
          return { success: false, error: "Network error. Please check your connection and try again." };
        }
      }
      
      return { success: false, error: "An unexpected error occurred. Please try again or contact support if the issue persists." };
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold">Withdrawals</h2>
        <p className="text-sm text-gray-600 mt-1">Request and track payouts from your campaign funds.</p>
      </div>

      <WithdrawalForm 
        campaignOptions={campaignOptions}
        requestPayout={requestPayout}
      />

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
              p.status === "completed" || p.status === "paid"
                ? "text-emerald-600"
                : p.status === "failed" || p.status === "rejected"
                ? "text-rose-600"
                : p.status === "processing" || p.status === "approved"
                ? "text-amber-600"
                : "text-gray-500";
            
            const displayStatus = p.status === "paid" ? "completed" : p.status;
            return (
              <div key={String(p._id)} className="py-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{title}</span>
                  <span className="text-gray-500">{new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={statusColor}>{displayStatus.replace("_", " ")}</span>
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


