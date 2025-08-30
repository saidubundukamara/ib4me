"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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

interface CampaignOption {
  id: string;
  title: string;
  currency: string;
  availableMinor: number;
}

interface Payout {
  _id: string;
  campaignId: string;
  status: string;
  amountMinor: number;
  createdAt: string;
}

interface Campaign {
  _id: string;
  slug: string;
  patient?: { name?: string };
  diagnosis?: string;
  goal?: { currency?: string };
}

export default function UserWithdrawalsPage() {
  const { data: session } = useSession();
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    try {
      const [campaignsRes, payoutsRes] = await Promise.all([
        fetch("/api/user/campaigns"),
        fetch("/api/user/payouts"),
      ]);

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
        
        // Transform campaigns into options
        const options = campaignsData.map((c: Campaign & { totals?: { raisedMinor?: number }; withdrawals?: { totalPaidMinor?: number } }) => {
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
        setCampaignOptions(options);
      }

      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayouts(payoutsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Function to refresh data after successful payout
  const handlePayoutSuccess = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-semibold">Withdrawals</h2>
          <p className="text-sm text-gray-600 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold">Withdrawals</h2>
        <p className="text-sm text-gray-600 mt-1">Request and track payouts from your campaign funds.</p>
      </div>

      <WithdrawalForm 
        campaignOptions={campaignOptions}
        onSuccess={handlePayoutSuccess}
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