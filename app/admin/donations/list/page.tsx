"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
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
  Search, 
  Eye, 
  Flag, 
  RefreshCw, 
  Receipt,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard
} from "lucide-react";

interface Donation {
  _id: string;
  campaignId: {
    _id: string;
    slug: string;
    patient: { name: string };
    diagnosis: string;
  } | null;
  donorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  donorSnapshot: {
    name?: string;
    email?: string;
  } | null;
  isAnonymous: boolean;
  message: string | null;
  amount: {
    currency: string;
    minor: number;
  };
  status: "pending" | "succeeded" | "failed" | "refunded";
  provider: {
    name: string;
    paymentId?: string;
    checkoutSessionId?: string;
  };
  fees?: {
    paymentFeeMinor?: number;
    platformFeeMinor?: number;
  };
  netAmountMinor?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isFlagged?: boolean;
  flagReason?: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function AdminDonationsListPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flaggingDonation, setFlaggingDonation] = useState<Donation | null>(null);
  const [flagReason, setFlagReason] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [amountMinFilter, setAmountMinFilter] = useState("");
  const [amountMaxFilter, setAmountMaxFilter] = useState("");
  const [anonymousFilter, setAnonymousFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDonations = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (providerFilter) params.append("provider", providerFilter);
      if (dateFromFilter) params.append("dateFrom", dateFromFilter);
      if (dateToFilter) params.append("dateTo", dateToFilter);
      if (amountMinFilter) params.append("amountMin", amountMinFilter);
      if (amountMaxFilter) params.append("amountMax", amountMaxFilter);
      if (anonymousFilter !== "all") params.append("isAnonymous", anonymousFilter);

      const response = await fetch(`/api/admin/donations?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch donations");
      }

      setDonations(data.donations);
      setPagination({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch donations");
    } finally {
      setLoading(false);
    }
  };

  const handleFlagClick = (donation: Donation) => {
    setFlaggingDonation(donation);
    setFlagReason("");
    setFlagDialogOpen(true);
  };

  const handleFlagConfirm = async () => {
    if (!flaggingDonation || !flagReason.trim()) return;

    try {
      const response = await fetch(`/api/admin/donations/${flaggingDonation._id}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: flagReason.trim(),
          flaggedBy: "current-admin-id", // TODO: Get from auth context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to flag donation");
      }

      toast.success("Donation flagged successfully", {
        description: `Donation has been flagged for review: ${flagReason}`,
      });
      fetchDonations();
    } catch (err: unknown) {
      toast.error("Failed to flag donation", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setFlagDialogOpen(false);
      setFlaggingDonation(null);
      setFlagReason("");
    }
  };

  const handleResendReceipt = async (donationId: string) => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}/resend-receipt`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend receipt");
      }

      toast.success("Receipt resent successfully");
    } catch (err: unknown) {
      toast.error("Failed to resend receipt", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleViewDetails = (donationId: string) => {
    router.push(`/admin/donations/${donationId}`);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDonations();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setProviderFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setAmountMinFilter("");
    setAmountMaxFilter("");
    setAnonymousFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Succeeded</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "refunded":
        return <Badge variant="outline" className="text-orange-600"><RefreshCw className="h-3 w-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDonorName = (donation: Donation) => {
    if (donation.isAnonymous) {
      return "Anonymous";
    }
    if (donation.donorSnapshot?.name) {
      return donation.donorSnapshot.name;
    }
    if (donation.donorId) {
      return `${donation.donorId.firstName} ${donation.donorId.lastName}`;
    }
    return "Unknown";
  };

  useEffect(() => {
    fetchDonations();
  }, [currentPage]);

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">All Donations</h1>
            <p className="text-muted-foreground">
              View and manage all donations in the system
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/donations")}>
            Back to Analytics
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Name, email, or payment ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Provider</label>
                <Input
                  placeholder="Provider name..."
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Anonymous</label>
                <Select value={anonymousFilter} onValueChange={setAnonymousFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Donors</SelectItem>
                    <SelectItem value="true">Anonymous Only</SelectItem>
                    <SelectItem value="false">Named Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Min Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountMinFilter}
                  onChange={(e) => setAmountMinFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Max Amount</label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={amountMaxFilter}
                  onChange={(e) => setAmountMaxFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Donations List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Donations ({pagination.total.toLocaleString()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading donations...</div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8">
                <p>No donations found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation._id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 ${
                      donation.isFlagged ? "border-red-300 bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        {/* First Row */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(donation.status)}
                            {donation.isFlagged && (
                              <Badge variant="destructive" className="text-xs">
                                <Flag className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(donation.createdAt).toLocaleString()}
                          </div>
                          <div className="font-semibold text-lg">
                            {formatCurrency(fromMinorUnits(donation.amount.minor), donation.amount.currency)}
                          </div>
                        </div>

                        {/* Second Row */}
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-sm text-muted-foreground">Donor: </span>
                            <span className="font-medium">{getDonorName(donation)}</span>
                            {donation.donorSnapshot?.email && !donation.isAnonymous && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({donation.donorSnapshot.email})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Campaign: </span>
                            <span className="font-medium">
                              {donation.campaignId?.patient?.name || donation.campaignId?.diagnosis || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm">{donation.provider.name}</span>
                          </div>
                        </div>

                        {/* Third Row - Message */}
                        {donation.message && (
                          <div className="text-sm text-muted-foreground bg-gray-100 p-2 rounded">
                            &ldquo;{donation.message}&rdquo;
                          </div>
                        )}

                        {/* Fourth Row - Fee Information */}
                        {donation.fees && (
                          <div className="text-xs text-muted-foreground flex gap-4">
                            {donation.fees.paymentFeeMinor && (
                              <span>
                                Payment Fee: {formatCurrency(fromMinorUnits(donation.fees.paymentFeeMinor))}
                              </span>
                            )}
                            {donation.netAmountMinor && (
                              <span>
                                Net Amount: {formatCurrency(fromMinorUnits(donation.netAmountMinor))}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Flag Reason */}
                        {donation.isFlagged && donation.flagReason && (
                          <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                            <strong>Flag Reason:</strong> {donation.flagReason}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(donation._id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {donation.status === "succeeded" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendReceipt(donation._id)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                        {!donation.isFlagged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFlagClick(donation)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            Flag
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} 
                  ({pagination.total.toLocaleString()} total donations)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flag Dialog */}
        <AlertDialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Flag Donation for Review</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for flagging this donation. This will mark it for administrative review.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter flag reason..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setFlagDialogOpen(false);
                setFlaggingDonation(null);
                setFlagReason("");
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleFlagConfirm}
                disabled={!flagReason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Flag Donation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}