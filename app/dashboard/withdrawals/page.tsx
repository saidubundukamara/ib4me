"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { WithdrawalForm } from "./WithdrawalForm";
import Card from "../_components/Card";
import { Calendar, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  _id?: string;
  id?: string;
  slug: string;
  patient?: { name?: string };
  diagnosis?: string;
  goal?: { currency?: string };
  totals?: { raisedMinor?: number };
  withdrawals?: { totalPaidMinor?: number };
}

interface WithdrawalBlockStatus {
  blocked: boolean;
  reason?: string;
}

export default function UserWithdrawalsPage() {
  const { data: session } = useSession();
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"request" | "recent">("request");
  const [withdrawalBlockStatus, setWithdrawalBlockStatus] = useState<WithdrawalBlockStatus>({
    blocked: false,
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    try {
      const [campaignsRes, payoutsRes, settingsRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/user/payouts"),
        fetch("/api/admin/settings?category=withdrawal"),
      ]);

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);

        // Transform campaigns into options
        const options = campaignsData.map((c: Campaign) => {
          const raised = c.totals?.raisedMinor ?? 0;
          const paid = c.withdrawals?.totalPaidMinor ?? 0;
          const available = Math.max(0, raised - paid);
          const currency = c.goal?.currency ?? "SLE";
          const title = c.patient?.name || c.diagnosis || c.slug;
          return {
            id: c.id || String(c._id),
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

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setWithdrawalBlockStatus({
          blocked: settingsData.settings?.withdrawalsBlocked ?? false,
          reason: settingsData.settings?.blockedReason,
        });
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

  const isLoading = loading;
  const totalAvailable = campaignOptions.reduce((sum, c) => sum + c.availableMinor, 0);
  const totalWithdrawnMinor = payouts
    .filter((p) => ["completed", "paid"].includes(p.status))
    .reduce((sum, p) => sum + p.amountMinor, 0);
  const pendingRequests = payouts.filter((p) =>
    ["pending", "processing", "approved"].includes(p.status)
  ).length;
  const primaryCurrency =
    campaignOptions[0]?.currency ?? campaigns[0]?.goal?.currency ?? "SLE";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border bg-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Available</p>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? (
                  <Skeleton className="h-6 w-24 rounded-md" />
                ) : (
                  formatCurrency(totalAvailable, primaryCurrency)
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blaze-orange/10">
              <TrendingUp className="w-6 h-6 text-blaze-orange" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? (
                  <Skeleton className="h-6 w-24 rounded-md" />
                ) : (
                  formatCurrency(totalWithdrawnMinor, primaryCurrency)
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-chartereuse/10">
              <Calendar className="w-6 h-6 text-chartereuse-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? (
                  <Skeleton className="h-6 w-12 rounded-md" />
                ) : (
                  pendingRequests
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "request" | "recent")}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1 sm:flex sm:flex-wrap sm:gap-2 md:flex-nowrap md:overflow-x-auto lg:overflow-visible">
          <TabsTrigger
            value="request"
            className="flex w-full items-center justify-center rounded-2xl px-3 py-2 text-xs font-medium transition data-[state=active]:bg-blaze-orange data-[state=active]:text-white data-[state=active]:shadow sm:flex-auto sm:px-4 sm:py-2 sm:text-sm md:w-auto"
          >
            Request Withdrawal
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="flex w-full items-center justify-center rounded-2xl px-3 py-2 text-xs font-medium transition data-[state=active]:bg-blaze-orange data-[state=active]:text-white data-[state=active]:shadow sm:flex-auto sm:px-4 sm:py-2 sm:text-sm md:w-auto"
          >
            Recent Withdrawals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="focus-visible:outline-none">
          <Card className="border-border bg-card p-6">
            <WithdrawalForm
              campaignOptions={campaignOptions}
              onSuccess={handlePayoutSuccess}
              isLoading={isLoading}
              withdrawalBlockStatus={withdrawalBlockStatus}
            />
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="focus-visible:outline-none">
          <Card className="border-border bg-card p-6">
            <h3 className="mb-4 text-xl font-semibold text-foreground">Recent Withdrawals</h3>
            <div className="space-y-3">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div
                    key={`payout-skel-${i}`}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-48 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-20 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                  </div>
                ))
              ) : payouts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No withdrawal requests yet</p>
                </div>
              ) : (
                payouts.map((p) => {
                  const campaign = campaigns.find((c) => (c.id || String(c._id)) === String(p.campaignId));
                  const currency = campaign?.goal?.currency ?? "SLE";
                  const title =
                    campaign?.patient?.name || campaign?.diagnosis || campaign?.slug || "Campaign";
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
                    <div
                      key={String(p._id)}
                      className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-4 transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="truncate font-medium text-foreground">{title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(p.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
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
                })
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>  
  );
}
