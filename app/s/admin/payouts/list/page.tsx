"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, XCircle, Filter, Search, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface PayoutMethod {
  type: "mobile_money" | "bank";
  provider?: string;
  msisdn?: string;
  accountNumber?: string;
  accountName?: string;
}

interface PolicyCheck {
  minThresholdMet?: boolean;
  overrideBy?: string | null;
}

interface Payout {
  _id: string;
  campaignId: {
    _id: string;
    slug: string;
    beneficiary?: { name: string };
    goal?: { targetMinor: number; currency: string };
  };
  requestedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amountMinor: number;
  method: PayoutMethod;
  status: string;
  policyCheck?: PolicyCheck;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const statusConfig = {
  processing: { label: "Processing", color: "bg-blue-500/15 text-blue-700", icon: Clock },
  threshold_review: { label: "Threshold Review", color: "bg-yellow-500/15 text-yellow-700", icon: AlertTriangle },
  in_review: { label: "In Review", color: "bg-orange-500/15 text-orange-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500/15 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-700", icon: XCircle },
  completed: { label: "Completed", color: "bg-green-500/15 text-green-700", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/15 text-red-700", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
  paid: { label: "Paid", color: "bg-green-500/15 text-green-700", icon: CheckCircle },
};

const formatCurrency = (amountMinor: number, currency: string = "SLE") => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PayoutListPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter states
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "/api/admin/payouts";
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sort: sortBy,
        order: sortOrder,
      });

      // Add filters based on active tab
      if (activeTab === "threshold_review") {
        url = "/api/admin/payouts/threshold-review";
      } else if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      // Add search term if provided
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payouts");
      }

      setPayouts(data.data || []);
      setPagination(data.pagination || {
        page: 1,
        totalPages: 1,
        total: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } catch (err) {
      console.error("Error fetching payouts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch payouts");
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, activeTab, statusFilter, searchTerm]);

  useEffect(() => {
    fetchPayouts();
  }, [activeTab, statusFilter, sortBy, sortOrder, currentPage, fetchPayouts]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPayouts();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleViewDetails = (payoutId: string) => {
    router.push(`/payouts/${payoutId}`);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="secondary">{status}</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading && payouts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading payouts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payout Management</h1>
            <p className="text-muted-foreground">
              Manage campaign withdrawals and threshold approvals
            </p>
          </div>
        </div>

        {/* Tabs and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Payouts</TabsTrigger>
                  <TabsTrigger value="threshold_review">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Threshold Review
                  </TabsTrigger>
                  <TabsTrigger value="pending">Pending Actions</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Search payouts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-64"
                  />
                  <Button onClick={handleSearch} size="sm">
                    Search
                  </Button>
                </div>

                {activeTab === "all" && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="threshold_review">Threshold Review</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split("-");
                  setSortBy(field);
                  setSortOrder(order as "asc" | "desc");
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="amountMinor-desc">Highest Amount</SelectItem>
                    <SelectItem value="amountMinor-asc">Lowest Amount</SelectItem>
                    <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <Button onClick={fetchPayouts} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {activeTab === "threshold_review" 
                    ? "No payouts pending threshold review"
                    : "No payouts found"
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payout.campaignId.beneficiary?.name || "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                #{payout.campaignId.slug}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payout.requestedBy.firstName} {payout.requestedBy.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payout.requestedBy.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(payout.amountMinor, payout.campaignId.goal?.currency)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {payout.method.type === "mobile_money" ? (
                                <>
                                  <div>Mobile Money</div>
                                  <div className="text-muted-foreground">
                                    {payout.method.msisdn}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>Bank Transfer</div>
                                  <div className="text-muted-foreground">
                                    {payout.method.accountNumber}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payout.status} />
                          </TableCell>
                          <TableCell>
                            {payout.policyCheck ? (
                              <div className="text-sm">
                                {payout.policyCheck.minThresholdMet ? (
                                  <Badge className="bg-green-500/15 text-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Met
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/15 text-red-700">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Below Min
                                  </Badge>
                                )}
                                {payout.policyCheck.overrideBy && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Override Applied
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payout.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(payout._id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}