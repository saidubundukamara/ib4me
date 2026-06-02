"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-provider";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalDonations: number;
  totalRevenue: number;
  campaignBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  donationBreakdown: {
    completed: number;
    failed: number;
    pending: number;
    refunded: number;
    successRate: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  averageDonationAmount: number;
  totalUsers: number;
  finance: {
    grossDonations: number;
    platformRevenue: number;
    processorFees: number;
    totalFees: number;
    netToCampaigns: number;
    effectiveTakeRateBps: number;
    paidOutToCampaigns: number;
    pendingPayouts: number;
    pendingPayoutAmount: number;
  };
  platformHealth: {
    campaignHealth: string;
    paymentHealth: string;
    systemHealth: string;
  };
}

const GREEN = "#00712D";
const ORANGE = "#FF6000";
const AMBER = "#FBB03B";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch dashboard stats");
      setStats(data.data);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fromMinorUnits = (amountMinor: number, currency = "SLE") =>
    amountMinor / Math.pow(10, currency === "SLE" ? 2 : 2);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-SL", { style: "currency", currency: "SLE" }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded-xl bg-muted mb-2" />
          <div className="h-4 w-64 rounded-xl bg-muted" />
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-background p-6">
              <div className="h-4 w-1/2 rounded-lg bg-muted mb-4" />
              <div className="h-8 w-3/4 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${ORANGE}15` }}
        >
          <svg className="h-8 w-8" style={{ color: ORANGE }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Error Loading Dashboard</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const topCards = [
    {
      label: "Total Campaigns",
      value: formatNumber(stats.totalCampaigns),
      sub: `${stats.activeCampaigns} active`,
      color: GREEN,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: "Total Donations",
      value: formatNumber(stats.totalDonations),
      sub: `Avg: ${formatCurrency(fromMinorUnits(stats.averageDonationAmount))}`,
      color: ORANGE,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: "Total Raised",
      value: formatCurrency(fromMinorUnits(stats.totalRevenue)),
      sub: "Gross donation volume",
      color: AMBER,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
    {
      label: "Platform Revenue",
      value: formatCurrency(fromMinorUnits(stats.finance?.platformRevenue ?? 0)),
      sub: `${((stats.finance?.effectiveTakeRateBps ?? 0) / 100).toFixed(1)}% effective take`,
      color: GREEN,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const campaignStatus = [
    { label: "Approved", value: stats.campaignBreakdown?.approved ?? 0, color: GREEN },
    { label: "Pending", value: stats.campaignBreakdown?.pending ?? 0, color: AMBER },
    { label: "Rejected", value: stats.campaignBreakdown?.rejected ?? 0, color: "#EF4444" },
    { label: "Completed", value: stats.campaignBreakdown?.completed ?? 0, color: "#8B5CF6" },
  ];

  const paymentStats = [
    { label: "Completed", value: `${formatNumber(stats.donationBreakdown?.completed ?? 0)} donations`, bg: `${GREEN}10`, dot: GREEN, text: `${GREEN}` },
    { label: "Failed", value: `${formatNumber(stats.donationBreakdown?.failed ?? 0)} donations`, bg: "#EF444410", dot: "#EF4444", text: "#EF4444" },
    { label: "Success Rate", value: `${stats.donationBreakdown?.successRate ?? 0}%`, bg: `${ORANGE}10`, dot: ORANGE, text: ORANGE },
  ];

  const fin = stats.finance;
  const money = (minor: number) => formatCurrency(fromMinorUnits(minor ?? 0));
  const financialOverview = [
    { label: "Platform Revenue", value: money(fin?.platformRevenue ?? 0), sub: "Our net earnings (processing fee)", bg: `${GREEN}10`, dot: GREEN, text: GREEN },
    { label: "Net to Campaigns", value: money(fin?.netToCampaigns ?? 0), sub: "Owed to campaigns after fees", bg: `${ORANGE}10`, dot: ORANGE, text: ORANGE },
    { label: "Withdrawn to Campaigns", value: money(fin?.paidOutToCampaigns ?? 0), sub: "Disbursed incl. in-transit", bg: "#8B5CF610", dot: "#8B5CF6", text: "#8B5CF6" },
    { label: "Awaiting Payout", value: money(fin?.pendingPayoutAmount ?? 0), sub: `${formatNumber(fin?.pendingPayouts ?? 0)} awaiting review`, bg: `${AMBER}15`, dot: AMBER, text: "#B45309" },
    { label: "Processor Fees (Monime)", value: money(fin?.processorFees ?? 0), sub: "Pass-through, not our revenue", bg: "#64748B10", dot: "#64748B", text: "#475569" },
    { label: "Total Fees Collected", value: money(fin?.totalFees ?? 0), sub: "Platform + processor fees", bg: "#0EA5E910", dot: "#0EA5E9", text: "#0369A1" },
  ];

  const healthItems = [
    { label: "Campaign Health", value: stats.platformHealth?.campaignHealth ?? "warning", icon: "❤️" },
    { label: "Payment Health", value: stats.platformHealth?.paymentHealth ?? "warning", icon: "💳" },
    { label: "System Health", value: stats.platformHealth?.systemHealth ?? "warning", icon: "⚙️" },
  ];

  return (
    <div className="space-y-6 font-Sora">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold" style={{ color: GREEN }}>{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Updated {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: GREEN }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {topCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: card.color }}
              >
                {card.icon}
              </div>
            </div>
            {/* Colored bottom accent */}
            <div className="mt-4 h-1 w-full rounded-full" style={{ backgroundColor: `${card.color}25` }}>
              <div className="h-1 w-2/3 rounded-full" style={{ backgroundColor: card.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Campaign status + Payment stats */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Campaign Status */}
        <div className="rounded-2xl border border-border bg-background p-6">
          <h3 className="mb-5 text-base font-bold text-foreground">Campaign Status</h3>
          <div className="space-y-3">
            {campaignStatus.map((item) => {
              const total = Object.values(stats.campaignBreakdown ?? {}).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {formatNumber(item.value)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Stats */}
        <div className="rounded-2xl border border-border bg-background p-6">
          <h3 className="mb-5 text-base font-bold text-foreground">Payment Statistics</h3>
          <div className="space-y-3">
            {paymentStats.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl p-4"
                style={{ backgroundColor: item.bg }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.dot }} />
                  <span className="text-sm font-medium" style={{ color: item.text }}>{item.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: item.text }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Financial Overview</h3>
          <span className="text-xs text-muted-foreground">
            {formatNumber(stats.totalUsers)} platform users
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {financialOverview.map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4"
              style={{ backgroundColor: item.bg }}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.dot }} />
                <span className="text-sm font-medium" style={{ color: item.text }}>{item.label}</span>
              </div>
              <p className="mt-2 text-xl font-bold" style={{ color: item.text }}>{item.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Health */}
      <div>
        <h3 className="mb-4 text-base font-bold text-foreground">Platform Health</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {healthItems.map((item) => {
            const isHealthy = item.value === "healthy";
            const color = isHealthy ? GREEN : AMBER;
            return (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: `${color}15` }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-bold" style={{ color }}>
                    {isHealthy ? "Healthy" : "Warning"}
                  </p>
                </div>
                <div className="ml-auto">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
