"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gift,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// Currency formatting functions
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

interface TipAnalytics {
  totalTips: number;
  totalAmountMinor: number;
  successfulTips: number;
  successfulAmountMinor: number;
  pendingTips: number;
  pendingAmountMinor: number;
  failedTips: number;
  averageTipMinor: number;
  successRate: number;
}

interface TopTipper {
  name: string;
  email?: string;
  totalAmountMinor: number;
  tipCount: number;
  lastTipDate: string;
  isAnonymous: boolean;
}

interface RecentTip {
  _id: string;
  tipperSnapshot?: { name?: string; email?: string } | null;
  isAnonymous: boolean;
  amount: { minor: number; currency: string };
  status: string;
  message?: string | null;
  createdAt: string;
}

export default function AdminTipsPage() {
  const [analytics, setAnalytics] = useState<TipAnalytics | null>(null);
  const [topTippers, setTopTippers] = useState<TopTipper[]>([]);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let dateFrom: string | undefined;

      // Set date filters based on selection
      const now = new Date();
      switch (dateFilter) {
        case "today":
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          break;
        case "week": {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFrom = weekAgo.toISOString();
          break;
        }
        case "month": {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          dateFrom = monthAgo.toISOString();
          break;
        }
        case "year": {
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          dateFrom = yearAgo.toISOString();
          break;
        }
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);

      // Fetch all analytics data in parallel
      const [analyticsRes, tippersRes, recentRes] = await Promise.all([
        fetch(`/api/admin/tips/analytics?${params}`),
        fetch("/api/admin/tips/top-tippers?limit=10"),
        fetch("/api/admin/tips?limit=20"),
      ]);

      if (!analyticsRes.ok) {
        throw new Error("Failed to fetch tip analytics");
      }

      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.data);

      if (tippersRes.ok) {
        const tippersData = await tippersRes.json();
        setTopTippers(tippersData.data || []);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentTips(recentData.data?.tips || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter, fetchAnalytics]);

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge className="bg-green-500/15 text-green-700">Succeeded</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/15 text-yellow-700">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/15 text-red-700">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-purple-500/15 text-purple-700">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="font-Sora space-y-6">
        <div className="text-center py-8">Loading tip analytics...</div>
      </div>
    );
  }

  return (
    <div className="font-Sora space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="h-7 w-7" style={{ color: "#00712D" }} />
            Platform Tips
          </h1>
          <p className="text-muted-foreground">
            Monitor platform tips and supporter activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAnalytics} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href="/tip" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Tip Page
            </a>
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
              { key: "year", label: "Last Year" },
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
                  <p className="text-sm font-medium text-muted-foreground">Total Tips</p>
                  <p className="text-2xl font-bold">{analytics.totalTips.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8" style={{ color: "#00712D" }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(fromMinorUnits(analytics.totalAmountMinor))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8" style={{ color: "#00712D" }} />
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
                  <p className="text-sm font-medium text-muted-foreground">Average Tip</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(fromMinorUnits(analytics.averageTipMinor))}
                  </p>
                </div>
                <Gift className="h-8 w-8" style={{ color: "#8B5CF6" }} />
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
              <CardTitle style={{ color: "#00712D" }}>Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Count:</span>
                  <span className="font-semibold">{analytics.successfulTips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(fromMinorUnits(analytics.successfulAmountMinor))}
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
                  <span className="font-semibold">{analytics.pendingTips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(fromMinorUnits(analytics.pendingAmountMinor))}
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
                  <span className="font-semibold">{analytics.failedTips.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tippers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Supporters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTippers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tipper data available</p>
            ) : (
              <div className="space-y-4">
                {topTippers.map((tipper, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {tipper.isAnonymous ? "Anonymous Supporter" : tipper.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {tipper.tipCount} tips
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Last: {new Date(tipper.lastTipDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(fromMinorUnits(tipper.totalAmountMinor))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/s/admin/settings" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Configure Tipping Settings
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Tips CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tips</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTips.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tips received yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipper</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTips.map((tip) => (
                  <TableRow key={tip._id} className="hover:bg-muted/50">
                    <TableCell>
                      {tip.isAnonymous
                        ? "Anonymous"
                        : tip.tipperSnapshot?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(fromMinorUnits(tip.amount.minor, tip.amount.currency))}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tip.message || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(tip.status)}</TableCell>
                    <TableCell>
                      {new Date(tip.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
