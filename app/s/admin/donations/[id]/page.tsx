"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
  Flag,
  FlagOff, 
  Receipt,
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign,
  CreditCard,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye
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
  flaggedAt?: string;
  flaggedBy?: string;
  unflaggedAt?: string;
  unflaggedBy?: string;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  failureReason?: string;
}

export default function AdminDonationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const donationId = params.id as string;

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [unflagDialogOpen, setUnflagDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const fetchDonation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/donations/${donationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch donation");
      }

      setDonation(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch donation");
    } finally {
      setLoading(false);
    }
  }, [donationId]);

  const handleFlag = async () => {
    if (!flagReason.trim()) return;

    try {
      const response = await fetch(`/api/admin/donations/${donationId}/flag`, {
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

      toast.success("Donation flagged successfully");
      setFlagDialogOpen(false);
      setFlagReason("");
      fetchDonation();
    } catch (err: unknown) {
      toast.error("Failed to flag donation", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleUnflag = async () => {
    try {
      const response = await fetch(`/api/admin/donations/${donationId}/flag`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unflaggedBy: "current-admin-id", // TODO: Get from auth context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to unflag donation");
      }

      toast.success("Donation unflagged successfully");
      setUnflagDialogOpen(false);
      fetchDonation();
    } catch (err: unknown) {
      toast.error("Failed to unflag donation", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) return;

    try {
      const response = await fetch(`/api/admin/donations/${donationId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: refundReason.trim(),
          refundedBy: "current-admin-id", // TODO: Get from auth context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to refund donation");
      }

      toast.success("Donation refunded successfully");
      setRefundDialogOpen(false);
      setRefundReason("");
      fetchDonation();
    } catch (err: unknown) {
      toast.error("Failed to refund donation", {
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleResendReceipt = async () => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-4 w-4 mr-1" />Succeeded</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-4 w-4 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-4 w-4 mr-1" />Failed</Badge>;
      case "refunded":
        return <Badge variant="outline" className="text-orange-600"><RefreshCw className="h-4 w-4 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDonorName = () => {
    if (!donation) return "Unknown";
    if (donation.isAnonymous) return "Anonymous";
    if (donation.donorSnapshot?.name) return donation.donorSnapshot.name;
    if (donation.donorId) return `${donation.donorId.firstName} ${donation.donorId.lastName}`;
    return "Unknown";
  };

  useEffect(() => {
    if (donationId) {
      fetchDonation();
    }
  }, [donationId, fetchDonation]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading donation details...</div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || "Donation not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Donation Details</h1>
              <p className="text-muted-foreground">
                Donation ID: {donation._id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(donation.status)}
            {donation.isFlagged && (
              <Badge variant="destructive">
                <Flag className="h-4 w-4 mr-1" />
                Flagged
              </Badge>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(fromMinorUnits(donation.amount.minor), donation.amount.currency)}
                </span>
              </div>
              {donation.fees?.paymentFeeMinor && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Fee:</span>
                  <span>
                    {formatCurrency(fromMinorUnits(donation.fees.paymentFeeMinor))}
                  </span>
                </div>
              )}
              {donation.fees?.platformFeeMinor && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span>
                    {formatCurrency(fromMinorUnits(donation.fees.platformFeeMinor))}
                  </span>
                </div>
              )}
              {donation.netAmountMinor && (
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-medium">Net Amount:</span>
                  <span className="font-bold">
                    {formatCurrency(fromMinorUnits(donation.netAmountMinor))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Provider:</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>{donation.provider.name}</span>
                </div>
              </div>
              {donation.provider.paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {donation.provider.paymentId}
                  </code>
                </div>
              )}
              {donation.provider.checkoutSessionId && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Session ID:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {donation.provider.checkoutSessionId}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Donor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{getDonorName()}</span>
              </div>
              {donation.donorSnapshot?.email && !donation.isAnonymous && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{donation.donorSnapshot.email}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Anonymous:</span>
                <span>{donation.isAnonymous ? "Yes" : "No"}</span>
              </div>
              {donation.donorId && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Registered User:</span>
                  <div className="flex items-center gap-2">
                    <span>Yes</span>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Information */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent>
            {donation.campaignId ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Patient Name:</span>
                  <span className="font-medium">{donation.campaignId.patient?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Diagnosis:</span>
                  <span>{donation.campaignId.diagnosis}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Campaign:</span>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/campaigns/${donation.campaignId?.slug}`, "_blank")}>
                    View Campaign
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Campaign information not available</p>
            )}
          </CardContent>
        </Card>

        {/* Message */}
        {donation.message && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Donor Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p>&ldquo;{donation.message}&rdquo;</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(donation.createdAt).toLocaleString()}</span>
            </div>
            {donation.completedAt && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed:</span>
                <span>{new Date(donation.completedAt).toLocaleString()}</span>
              </div>
            )}
            {donation.refundedAt && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Refunded:</span>
                <span>{new Date(donation.refundedAt).toLocaleString()}</span>
              </div>
            )}
            {donation.flaggedAt && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Flagged:</span>
                <span>{new Date(donation.flaggedAt).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flag Information */}
        {donation.isFlagged && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Flag Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {donation.flagReason && (
                <div>
                  <span className="text-muted-foreground">Reason:</span>
                  <div className="mt-1 p-3 bg-background rounded border border-border">
                    {donation.flagReason}
                  </div>
                </div>
              )}
              {donation.flaggedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Flagged At:</span>
                  <span>{new Date(donation.flaggedAt).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Refund Information */}
        {donation.status === "refunded" && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refund Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {donation.refundReason && (
                <div>
                  <span className="text-muted-foreground">Reason:</span>
                  <div className="mt-1 p-3 bg-background rounded border border-border">
                    {donation.refundReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Failure Information */}
        {donation.status === "failed" && donation.failureReason && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failure Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{donation.failureReason}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {donation.status === "succeeded" && (
                <Button variant="outline" onClick={handleResendReceipt}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Resend Receipt
                </Button>
              )}
              {!donation.isFlagged ? (
                <Button variant="outline" onClick={() => setFlagDialogOpen(true)} className="text-orange-600 hover:text-orange-700">
                  <Flag className="h-4 w-4 mr-2" />
                  Flag for Review
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setUnflagDialogOpen(true)} className="text-green-600 hover:text-green-700">
                  <FlagOff className="h-4 w-4 mr-2" />
                  Remove Flag
                </Button>
              )}
              {donation.status === "succeeded" && (
                <Button variant="outline" onClick={() => setRefundDialogOpen(true)} className="text-red-600 hover:text-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flag Dialog */}
        <AlertDialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Flag Donation for Review</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for flagging this donation.
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFlag} disabled={!flagReason.trim()} className="bg-orange-600 hover:bg-orange-700">
                Flag Donation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unflag Dialog */}
        <AlertDialog open={unflagDialogOpen} onOpenChange={setUnflagDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Flag</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove the flag from this donation? This will mark it as resolved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnflag} className="bg-green-600 hover:bg-green-700">
                Remove Flag
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Refund Dialog */}
        <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Process Refund</AlertDialogTitle>
              <AlertDialogDescription>
                This will initiate a refund for this donation. Please provide a reason for the refund.
                <br />
                <strong>Amount to refund: {formatCurrency(fromMinorUnits(donation.amount.minor))}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter refund reason..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRefund} disabled={!refundReason.trim()} className="bg-red-600 hover:bg-red-700">
                Process Refund
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}