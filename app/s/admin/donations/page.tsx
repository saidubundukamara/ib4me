"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Currency formatting functions without Monime service dependency
const fromMinorUnits = (amountMinor: number, currency: string = "SLE"): number => {
  const decimalPlaces = currency === "SLE" ? 2 : 2;
  return amountMinor / Math.pow(10, decimalPlaces);
};

const formatCurrency = (amount: number, currency: string = "SLE"): string => {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Users,
  CreditCard,
  PieChart,
  Activity,
  Calendar,
  Download
} from "lucide-react";

interface DonationAnalytics {
  totalDonations: number;
  totalAmount: number;
  successfulDonations: number;
  successfulAmount: number;
  pendingDonations: number;
  pendingAmount: number;
  failedDonations: number;
  failedAmount: number;
  refundedDonations: number;
  refundedAmount: number;
  paymentReceivedDonations: number;
  paymentReceivedAmount: number;
  averageDonation: number;
  successRate: number;
}

interface ProviderData {
  provider: string;
  count: number;
  amount: number;
  successRate: number;
}

interface TopDonor {
  donorName: string;
  donorEmail?: string;
  totalAmount: number;
  donationCount: number;
  lastDonation: string;
  isAnonymous: boolean;
}

interface RevenueData {
  totalRevenue: number;
  campaignPayouts: number;
  totalFees: number;
  netRevenue: number;
  platformFees: number;
  paymentFees: number;
}

export default function AdminDonationsPage() {
  const [analytics, setAnalytics] = useState<DonationAnalytics | null>(null);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      // Set date filters based on selection
      const now = new Date();
      switch (dateFilter) {
        case "today":
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFrom = weekAgo.toISOString();
          break;
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateFrom = monthAgo.toISOString();
          break;
        case "year":
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          dateFrom = yearAgo.toISOString();
          break;
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      // Fetch all analytics data in parallel
      const [analyticsRes, providersRes, donorsRes, revenueRes] = await Promise.all([
        fetch(`/api/admin/donations/analytics?${params}`),
        fetch(`/api/admin/donations/providers?${params}`),
        fetch("/api/admin/donations/top-donors?limit=10"),
        fetch(`/api/admin/donations/revenue?${params}`)
      ]);

      if (!analyticsRes.ok || !providersRes.ok || !donorsRes.ok || !revenueRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [analyticsData, providersData, donorsData, revenueData] = await Promise.all([
        analyticsRes.json(),
        providersRes.json(),
        donorsRes.json(),
        revenueRes.json()
      ]);

      setAnalytics(analyticsData.data);
      setProviders(providersData.data);
      setTopDonors(donorsData.data);
      setRevenue(revenueData.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log("Exporting donation data...");
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter, fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6 font-Sora">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-Sora">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Donation Analytics</h1>
            <p className="text-muted-foreground">
              Monitor donation activity and financial performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Time" },
                { key: "today", label: "Today" },
                { key: "week", label: "Last 7 Days" },
                { key: "month", label: "Last 30 Days" },
                { key: "year", label: "Last Year" }
              ].map((period) => (
                <Button
                  key={period.key}
                  variant={dateFilter === period.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateFilterChange(period.key)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Donations</p>
                    <p className="text-2xl font-bold">{analytics.totalDonations.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8" style={{ color: "#00712D" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(fromMinorUnits(analytics.successfulAmount))}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8" style={{ color: "#FF6000" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8" style={{ color: "#80E10A" }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Donation</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(fromMinorUnits(analytics.averageDonation))}
                    </p>
                  </div>
                  <Users className="h-8 w-8" style={{ color: "#FBB03B" }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Breakdown */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: "#00712D" }}>Successful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.successfulDonations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(fromMinorUnits(analytics.successfulAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ color: "#FBB03B" }}>Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.pendingDonations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(fromMinorUnits(analytics.pendingAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ color: "#2563EB" }}>Payment Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.paymentReceivedDonations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(fromMinorUnits(analytics.paymentReceivedAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.failedDonations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(fromMinorUnits(analytics.failedAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">Refunded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.refundedDonations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(fromMinorUnits(analytics.refundedAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Report */}
        {revenue && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold" style={{ color: "#00712D" }}>
                    {formatCurrency(fromMinorUnits(revenue.totalRevenue))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Gross charged to donors</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Campaign Payouts</p>
                  <p className="text-xl font-bold" style={{ color: "#80E10A" }}>
                    {formatCurrency(fromMinorUnits(revenue.campaignPayouts))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Sent to campaigns</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Payment Fees</p>
                  <p className="text-xl font-bold" style={{ color: "#FBB03B" }}>
                    {formatCurrency(fromMinorUnits(revenue.paymentFees))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Payment processor</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Platform Fees</p>
                  <p className="text-xl font-bold" style={{ color: "#FF6000" }}>
                    {formatCurrency(fromMinorUnits(revenue.platformFees))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">IB4ME service fee</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="text-xl font-bold" style={{ color: "#00712D" }}>
                    {formatCurrency(fromMinorUnits(revenue.netRevenue))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Platform earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No provider data available</p>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{provider.provider}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {provider.count} donations
                          </span>
                          <Badge variant="outline">
                            {provider.successRate.toFixed(1)}% success
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(fromMinorUnits(provider.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Donors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Donors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topDonors.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No donor data available</p>
              ) : (
                <div className="space-y-4">
                  {topDonors.map((donor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {donor.isAnonymous ? "Anonymous Donor" : donor.donorName}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {donor.donationCount} donations
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Last: {new Date(donor.lastDonation).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(fromMinorUnits(donor.totalAmount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => window.location.href = "/donations/list"}>
                <PieChart className="h-4 w-4 mr-2" />
                View All Donations
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}