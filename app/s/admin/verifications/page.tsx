"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, ShieldAlert, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface Verification {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  type: "kyc" | "kyb";
  status: "not_started" | "pending" | "under_review" | "approved" | "rejected";
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  });

  // Action dialogs
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    verificationId: string;
    action: "start_review" | "approve" | "reject";
    title: string;
    description: string;
  } | null>(null);

  const [rejectReason, setRejectReason] = useState("");

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/verifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, typeFilter]);

  // Fetch stats for each status
  const fetchStats = async () => {
    try {
      const statuses = ["pending", "under_review", "approved", "rejected"];
      const results = await Promise.all(
        statuses.map(async (status) => {
          const response = await fetch(
            `/api/admin/verifications?status=${status}&limit=1`
          );
          if (response.ok) {
            const data = await response.json();
            return { status, count: data.total };
          }
          return { status, count: 0 };
        })
      );

      const newStats = results.reduce(
        (acc, { status, count }) => {
          acc[status as keyof typeof acc] = count;
          return acc;
        },
        { pending: 0, under_review: 0, approved: 0, rejected: 0 }
      );

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Handle actions
  const handleAction = async () => {
    if (!actionDialog) return;

    const { verificationId, action } = actionDialog;

    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setUpdating(verificationId);

      let endpoint = "";
      let body = {};

      switch (action) {
        case "start_review":
          endpoint = `/api/admin/verifications/${verificationId}/start-review`;
          break;
        case "approve":
          endpoint = `/api/admin/verifications/${verificationId}/approve`;
          break;
        case "reject":
          endpoint = `/api/admin/verifications/${verificationId}/reject`;
          body = { reason: rejectReason };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          action === "start_review"
            ? "Verification is now under review"
            : action === "approve"
              ? "Verification approved successfully"
              : "Verification rejected"
        );
        fetchVerifications();
        fetchStats();
      } else {
        const data = await response.json();
        toast.error(data.message || "Action failed");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("An error occurred");
    } finally {
      setUpdating(null);
      setActionDialog(null);
      setRejectReason("");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [search, statusFilter, typeFilter, currentPage, fetchVerifications]);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
        icon: React.ReactNode;
      }
    > = {
      pending: { variant: "warning", icon: <Clock className="w-3 h-3 mr-1" /> },
      under_review: { variant: "info", icon: <Eye className="w-3 h-3 mr-1" /> },
      approved: { variant: "success", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      rejected: { variant: "destructive", icon: <XCircle className="w-3 h-3 mr-1" /> },
      not_started: { variant: "secondary", icon: null },
    };

    const { variant, icon } = config[status] || { variant: "default", icon: null };

    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "kyb" ? "info" : "secondary"}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-Sora">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Verifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve KYC/KYB verification requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#FF6000" }}>{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Eye className="w-4 h-4 mr-2 text-blue-500" />
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#00712D" }}>{stats.under_review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#00712D" }}>{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="kyc">KYC (Individual)</SelectItem>
                <SelectItem value="kyb">KYB (Organization)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setTypeFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" />
            Verifications ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p>No verifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div
                  key={verification._id}
                  className="border rounded-lg p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">
                            {verification.userName || "Unknown User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {verification.userEmail || verification.userPhone}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {getTypeBadge(verification.type)}
                          {getStatusBadge(verification.status)}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center space-x-6 text-sm text-muted-foreground">
                        {verification.submittedAt && (
                          <span>
                            Submitted:{" "}
                            {new Date(verification.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                        {verification.reviewedAt && (
                          <span>
                            Reviewed:{" "}
                            {new Date(verification.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                        {verification.rejectionReason && (
                          <span className="text-red-600">
                            Reason: {verification.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {verification.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updating === verification._id}
                          onClick={() =>
                            setActionDialog({
                              isOpen: true,
                              verificationId: verification._id,
                              action: "start_review",
                              title: "Start Review",
                              description:
                                "Mark this verification as under review. This indicates you are actively reviewing the documents.",
                            })
                          }
                        >
                          {updating === verification._id ? "..." : "Start Review"}
                        </Button>
                      )}

                      {(verification.status === "pending" ||
                        verification.status === "under_review") && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            style={{ backgroundColor: "#00712D" }}
                            disabled={updating === verification._id}
                            onClick={() =>
                              setActionDialog({
                                isOpen: true,
                                verificationId: verification._id,
                                action: "approve",
                                title: "Approve Verification",
                                description:
                                  "Are you sure you want to approve this verification? The user will be able to create campaigns.",
                              })
                            }
                          >
                            {updating === verification._id ? "..." : "Approve"}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updating === verification._id}
                            onClick={() =>
                              setActionDialog({
                                isOpen: true,
                                verificationId: verification._id,
                                action: "reject",
                                title: "Reject Verification",
                                description:
                                  "Please provide a reason for rejection. The user will be notified and can resubmit.",
                              })
                            }
                          >
                            {updating === verification._id ? "..." : "Reject"}
                          </Button>
                        </>
                      )}

                      <Link href={`/s/admin/verifications/${verification._id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages}
          </p>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Dialog */}
      {actionDialog && (
        <AlertDialog
          open={actionDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setActionDialog(null);
              setRejectReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {actionDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {actionDialog.action === "reject" && (
              <div className="py-4">
                <Textarea
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAction}
                className={
                  actionDialog.action === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : actionDialog.action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                }
              >
                {actionDialog.action === "start_review"
                  ? "Start Review"
                  : actionDialog.action === "approve"
                    ? "Approve"
                    : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
