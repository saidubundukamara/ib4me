"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquareQuote,
  Clock,
  CheckCircle,
  XCircle,
  Quote,
} from "lucide-react";
import { toast } from "sonner";

interface Testimonial {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  authorName: string;
  authorRole: string;
  quote: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  // Action dialogs
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    testimonialId: string;
    action: "approve" | "reject";
    title: string;
    description: string;
  } | null>(null);

  const [rejectReason, setRejectReason] = useState("");

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/testimonials?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.testimonials);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/testimonials?stats=true");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Handle actions
  const handleAction = async () => {
    if (!actionDialog) return;

    const { testimonialId, action } = actionDialog;

    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setUpdating(testimonialId);

      const endpoint =
        action === "approve"
          ? `/api/admin/testimonials/${testimonialId}/approve`
          : `/api/admin/testimonials/${testimonialId}/reject`;

      const body = action === "reject" ? { reason: rejectReason } : {};

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          action === "approve"
            ? "Testimonial approved successfully"
            : "Testimonial rejected"
        );
        fetchTestimonials();
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
    fetchTestimonials();
  }, [search, statusFilter, currentPage, fetchTestimonials]);

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
        icon: React.ReactNode;
      }
    > = {
      pending: { variant: "warning", icon: <Clock className="w-3 h-3 mr-1" /> },
      approved: {
        variant: "success",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      rejected: {
        variant: "destructive",
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    const { variant, icon } = config[status] || { variant: "default", icon: null };

    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {status}
      </Badge>
    );
  };

  const getAvatarUrl = (name: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Testimonials</h2>
        <p className="text-sm text-gray-600 mt-1">
          Review and approve user testimonials for the homepage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by author name..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquareQuote className="w-5 h-5 mr-2" />
            Testimonials ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testimonials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquareQuote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No testimonials found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Author info and quote */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={getAvatarUrl(testimonial.authorName)}
                            alt={testimonial.authorName}
                          />
                          <AvatarFallback>
                            {testimonial.authorName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {testimonial.authorName}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({testimonial.authorRole})
                            </span>
                            {getStatusBadge(testimonial.status)}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            Submitted by: {testimonial.userName} ({testimonial.userEmail})
                          </div>

                          {/* Quote */}
                          <div className="mt-3 flex items-start gap-2">
                            <Quote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                            <p className="text-gray-700 italic">
                              {testimonial.quote}
                            </p>
                          </div>

                          {/* Rejection reason if rejected */}
                          {testimonial.status === "rejected" &&
                            testimonial.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                                <strong>Rejection reason:</strong>{" "}
                                {testimonial.rejectionReason}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:ml-4">
                      {testimonial.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={updating === testimonial._id}
                            onClick={() =>
                              setActionDialog({
                                isOpen: true,
                                testimonialId: testimonial._id,
                                action: "approve",
                                title: "Approve Testimonial",
                                description:
                                  "This testimonial will be displayed on the homepage. Are you sure you want to approve it?",
                              })
                            }
                          >
                            {updating === testimonial._id ? "..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={updating === testimonial._id}
                            onClick={() =>
                              setActionDialog({
                                isOpen: true,
                                testimonialId: testimonial._id,
                                action: "reject",
                                title: "Reject Testimonial",
                                description:
                                  "Please provide a reason for rejecting this testimonial. The user will be able to see this reason and can edit and resubmit.",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {testimonial.status === "approved" && (
                        <span className="text-sm text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Live on homepage
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
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
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <AlertDialog
        open={actionDialog?.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionDialog?.action === "reject" && (
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
                actionDialog?.action === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {actionDialog?.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
