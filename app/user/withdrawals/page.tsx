"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { WithdrawalForm } from "./WithdrawalForm";
import Card from "../_components/Card";
import { Calendar, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
          const currency = c.goal?.currency ?? "SLE";
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
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 border-border bg-card">
              <div className="flex items-center gap-4">
                <Skeleton className="p-3 rounded-xl w-12 h-12" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Withdrawals Card Skeleton */}
        <Card className="p-6 border-border bg-card">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-6">
            {/* WithdrawalForm Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            {/* Recent Withdrawals List Skeleton */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-background">
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const totalAvailable = campaignOptions.reduce((sum, c) => sum + c.availableMinor, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border bg-card hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Available</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAvailable, "SLE")}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border bg-card hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-2xl font-bold text-foreground">$1,050.00</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border bg-card hover:shadow-lg transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/10">
              <Calendar className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold text-foreground">1</p>
            </div>
          </div>
        </Card>
      </div>
    <Card className="p-6 border-border bg-card">
      <h3 className="text-xl font-semibold text-foreground mb-4">Recent Withdrawals</h3>
      <div className="space-y-6">

        <WithdrawalForm
          campaignOptions={campaignOptions}
          onSuccess={handlePayoutSuccess}
        />

        <div className="space-y-3">
          {payouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No withdrawal requests yet</p>
            </div>
          )}
          {payouts.map((p) => {
            const campaign = campaigns.find((c) => String(c._id) === String(p.campaignId));
            const currency = campaign?.goal?.currency ?? "SLE";
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
              <div key={String(p._id)} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-background hover:shadow-md transition-all gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{title}</p>

                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-gray-500">{new Date(p.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColor}>
                    <span className="sr-only">{displayStatus.replace("_", " ")}</span>
                  </Badge>
                  <span className="text-gray-700">{formatCurrency(p.amountMinor, currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  </div>
  );
}