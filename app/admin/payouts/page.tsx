"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  Calendar,
  Download,
  Eye,
  FileText
} from "lucide-react";

interface PayoutAnalytics {
  totalPayouts: number;
  totalAmount: number;
  completedPayouts: number;
  completedAmount: number;
  pendingPayouts: number;
  pendingAmount: number;
  failedPayouts: number;
  failedAmount: number;
  averagePayout: number;
  successRate: number;
}

interface MethodData {
  method: string;
  count: number;
  amount: number;
  successRate: number;
}

interface TopCampaign {
  campaignId: string;
  campaignName: string;
  totalAmount: number;
  payoutCount: number;
  lastPayout: string;
}

interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

interface PendingPayout {
  _id: string;
  campaignId: {
    slug: string;
    patient: { name: string };
    diagnosis: string;
  };
  requestedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  amountMinor: number;
  method: {
    type: string;
    accountName?: string;
    accountNumber?: string;
    msisdn?: string;
  };
  createdAt: string;
  status: string;
}

export default function AdminPayoutsPage() {
  const [analytics, setAnalytics] = useState<PayoutAnalytics | null>(null);
  const [methods, setMethods] = useState<MethodData[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchAnalytics = async () => {
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
      const [analyticsRes, methodsRes, campaignsRes, statusRes, pendingRes] = await Promise.all([
        fetch(`/api/admin/payouts/analytics?${params}`),
        fetch(`/api/admin/payouts/methods?${params}`),
        fetch("/api/admin/payouts/top-campaigns?limit=10"),
        fetch("/api/admin/payouts/status-breakdown"),
        fetch("/api/admin/payouts/pending")
      ]);

      if (!analyticsRes.ok || !methodsRes.ok || !campaignsRes.ok || !statusRes.ok || !pendingRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [analyticsData, methodsData, campaignsData, statusData, pendingData] = await Promise.all([
        analyticsRes.json(),
        methodsRes.json(),
        campaignsRes.json(),
        statusRes.json(),
        pendingRes.json()
      ]);

      setAnalytics(analyticsData.data);
      setMethods(methodsData.data);
      setTopCampaigns(campaignsData.data);
      setStatusBreakdown(statusData.data);
      setPendingPayouts(pendingData.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log("Exporting payout data...");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing":
      case "in_review":
      case "approved":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
      case "rejected":
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "mobile_money":
        return "Mobile Money";
      case "bank":
        return "Bank Transfer";
      default:
        return method;
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading payout analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payout Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage campaign withdrawals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button onClick={() => window.location.href = "/admin/payouts/list"}>
              <Eye className="h-4 w-4 mr-2" />
              View All
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
                    <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                    <p className="text-2xl font-bold">{analytics.totalPayouts.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(fromMinorUnits(analytics.totalAmount))}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
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
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Payout</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(fromMinorUnits(analytics.averagePayout))}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Breakdown */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.completedPayouts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(fromMinorUnits(analytics.completedAmount))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.pendingPayouts.toLocaleString()}</span>
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
                <CardTitle className="text-red-600">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-semibold">{analytics.failedPayouts.toLocaleString()}</span>
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
          </div>
        )}

        {/* Pending Approvals */}
        {pendingPayouts.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Approvals ({pendingPayouts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayouts.slice(0, 5).map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {payout.campaignId.patient?.name || payout.campaignId.diagnosis}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {payout.requestedBy.firstName} {payout.requestedBy.lastName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getMethodLabel(payout.method.type)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(fromMinorUnits(payout.amountMinor))}
                      </p>
                      {getStatusBadge(payout.status)}
                    </div>
                  </div>
                ))}
                {pendingPayouts.length > 5 && (
                  <Button variant="outline" onClick={() => window.location.href = "/admin/payouts/list?requiresApproval=true"} className="w-full">
                    View All {pendingPayouts.length} Pending Payouts
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {methods.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No method data available</p>
              ) : (
                <div className="space-y-4">
                  {methods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{getMethodLabel(method.method)}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {method.count} payouts
                          </span>
                          <Badge variant="outline">
                            {method.successRate.toFixed(1)}% success
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(fromMinorUnits(method.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Campaigns by Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCampaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No campaign data available</p>
              ) : (
                <div className="space-y-4">
                  {topCampaigns.map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{campaign.campaignName}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {campaign.payoutCount} payouts
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Last: {new Date(campaign.lastPayout).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(fromMinorUnits(campaign.totalAmount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => window.location.href = "/admin/payouts/list"}>
                <FileText className="h-4 w-4 mr-2" />
                View All Payouts
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/admin/payouts/list?requiresApproval=true"}>
                <Clock className="h-4 w-4 mr-2" />
                Pending Approvals
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
    </div>
  );
}