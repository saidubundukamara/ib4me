"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  User,
  FileText,
  ShieldCheck,
  Eye,
  Download,
  Building,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DocumentAsset {
  _id: string;
  url?: string | null;
  type?: string | null;
}

interface UserOrganization {
  name?: string;
  type?: string;
  registrationNumber?: string;
  description?: string;
}

interface Verification {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userOrganization?: UserOrganization | null;
  type: "kyc" | "kyb";
  status: "not_started" | "pending" | "under_review" | "approved" | "rejected";
  submittedAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string;
  rejectionReason?: string;
  kycDocuments?: {
    idDocument?: DocumentAsset | string;
    addressProof?: DocumentAsset | string;
  };
  kybDocuments?: {
    registrationCertificate?: DocumentAsset | string;
    representativeId?: DocumentAsset | string;
    addressProof?: DocumentAsset | string;
    taxCertificate?: DocumentAsset | string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-800",
    icon: Eye,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const verificationId = params.id as string;

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showStartReviewDialog, setShowStartReviewDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  // Common rejection reasons
  const commonIssues = [
    { id: "blurry", label: "Document is blurry or hard to read" },
    { id: "dark", label: "Document is too dark" },
    { id: "cropped", label: "Document is cropped or incomplete" },
    { id: "expired", label: "Document has expired" },
    { id: "mismatch", label: "Name on document doesn't match account" },
    { id: "wrong_doc", label: "Wrong type of document uploaded" },
  ];

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const buildRejectionReason = () => {
    const issueLabels = selectedIssues.map(
      id => commonIssues.find(i => i.id === id)?.label
    ).filter(Boolean);

    let reason = "";
    if (issueLabels.length > 0) {
      reason = "Issues found:\n- " + issueLabels.join("\n- ");
    }
    if (rejectReason.trim()) {
      reason += (reason ? "\n\nAdditional notes:\n" : "") + rejectReason.trim();
    }
    return reason;
  };

  const fetchVerificationDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/verifications/${verificationId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch verification");
      }

      const data = await response.json();
      setVerification(data.verification);
    } catch (err) {
      console.error("Error fetching verification details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch verification details"
      );
    } finally {
      setLoading(false);
    }
  }, [verificationId]);

  useEffect(() => {
    if (verificationId) {
      fetchVerificationDetails();
    }
  }, [verificationId, fetchVerificationDetails]);

  const handleAction = async (action: "start_review" | "approve" | "reject") => {
    if (!verification) return;

    const fullRejectionReason = buildRejectionReason();

    if (action === "reject" && !fullRejectionReason.trim()) {
      toast.error("Please select at least one issue or provide a rejection reason");
      return;
    }

    try {
      setActionLoading(action);

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
          body = { reason: fullRejectionReason };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} verification`);
      }

      toast.success(
        action === "start_review"
          ? "Verification is now under review"
          : action === "approve"
            ? "Verification approved successfully"
            : "Verification rejected"
      );

      // Refresh data
      await fetchVerificationDetails();

      // Close dialogs and reset form
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setShowStartReviewDialog(false);
      setRejectReason("");
      setSelectedIssues([]);
    } catch (err) {
      console.error(`Error ${action}ing verification:`, err);
      toast.error(err instanceof Error ? err.message : `Failed to ${action} verification`);
    } finally {
      setActionLoading(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status];
    if (!config) return <Badge variant="secondary">{status}</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  const DocumentCard = ({
    label,
    document,
  }: {
    label: string;
    document?: DocumentAsset | string | null;
  }) => {
    if (!document) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-gray-400">
            <FileText className="w-8 h-8 mb-2" />
            <p className="text-sm">{label}</p>
            <p className="text-xs">Not uploaded</p>
          </CardContent>
        </Card>
      );
    }

    const docData = typeof document === "string" ? null : document;
    // Check if it's an image based on the type field or URL extension
    const isImage = docData?.type?.startsWith("image/") ||
      docData?.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          {docData?.url ? (
            <div className="space-y-2">
              {isImage ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={docData.url}
                    alt={label}
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 truncate">
                  {docData.type || "Document"}
                </span>
                <a
                  href={docData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Document ID: {typeof document === "string" ? document : docData?._id}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 mb-4">{error || "Verification not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const canStartReview = verification.status === "pending";
  const canApprove =
    verification.status === "pending" || verification.status === "under_review";
  const canReject =
    verification.status === "pending" || verification.status === "under_review";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Verification Details</h1>
            <p className="text-gray-600">
              {verification.type.toUpperCase()} Verification for{" "}
              {verification.userName || "Unknown User"}
            </p>
          </div>
        </div>
        <StatusBadge status={verification.status} />
      </div>

      {/* Admin Actions */}
      {(canStartReview || canApprove || canReject) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              {canStartReview && (
                <Dialog
                  open={showStartReviewDialog}
                  onOpenChange={setShowStartReviewDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Start Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start Review</DialogTitle>
                      <DialogDescription>
                        Mark this verification as under review. This indicates you
                        are actively reviewing the documents.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowStartReviewDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleAction("start_review")}
                        disabled={actionLoading === "start_review"}
                      >
                        {actionLoading === "start_review"
                          ? "Processing..."
                          : "Start Review"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canApprove && (
                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Verification</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to approve this{" "}
                        {verification.type.toUpperCase()} verification? The user
                        will be able to create campaigns.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowApproveDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAction("approve")}
                        disabled={actionLoading === "approve"}
                      >
                        {actionLoading === "approve" ? "Approving..." : "Approve"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canReject && (
                <Dialog
                  open={showRejectDialog}
                  onOpenChange={(open) => {
                    setShowRejectDialog(open);
                    if (!open) {
                      setRejectReason("");
                      setSelectedIssues([]);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Reject Verification</DialogTitle>
                      <DialogDescription>
                        Select the issues found with the documents. The user will be
                        notified and can resubmit with corrected documents.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Common Issues</Label>
                        <div className="space-y-2">
                          {commonIssues.map((issue) => (
                            <div key={issue.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={issue.id}
                                checked={selectedIssues.includes(issue.id)}
                                onCheckedChange={() => toggleIssue(issue.id)}
                              />
                              <Label
                                htmlFor={issue.id}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {issue.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
                        <Textarea
                          placeholder="Add any additional details about the rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleAction("reject")}
                        disabled={
                          (selectedIssues.length === 0 && !rejectReason.trim()) ||
                          actionLoading === "reject"
                        }
                      >
                        {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="font-medium">
                    {verification.userName || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-xs text-gray-400 truncate">
                    {verification.userId || "Unknown"}
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p>{verification.userEmail || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p>{verification.userPhone || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Organization Info (for KYB) */}
              {verification.type === "kyb" && verification.userOrganization && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center mb-3">
                    <Building className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">Organization Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Organization Name
                      </label>
                      <p>{verification.userOrganization.name || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="capitalize">
                        {verification.userOrganization.type || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Registration Number
                      </label>
                      <p>
                        {verification.userOrganization.registrationNumber ||
                          "Not provided"}
                      </p>
                    </div>
                    {verification.userOrganization.description && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-500">
                          Description
                        </label>
                        <p>{verification.userOrganization.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {verification.type === "kyc" ? "KYC Documents" : "KYB Documents"}
              </CardTitle>
              <CardDescription>
                {verification.type === "kyc"
                  ? "Identity document and proof of address"
                  : "Business registration documents"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verification.type === "kyc" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentCard
                    label="ID Document"
                    document={verification.kycDocuments?.idDocument}
                  />
                  <DocumentCard
                    label="Address Proof"
                    document={verification.kycDocuments?.addressProof}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentCard
                    label="Registration Certificate"
                    document={verification.kybDocuments?.registrationCertificate}
                  />
                  <DocumentCard
                    label="Representative ID"
                    document={verification.kybDocuments?.representativeId}
                  />
                  <DocumentCard
                    label="Address Proof"
                    document={verification.kybDocuments?.addressProof}
                  />
                  <DocumentCard
                    label="Tax Certificate"
                    document={verification.kybDocuments?.taxCertificate}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Verification Info */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p>
                  <Badge variant={verification.type === "kyb" ? "info" : "secondary"}>
                    {verification.type.toUpperCase()}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <StatusBadge status={verification.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Submitted At
                </label>
                <p>
                  {verification.submittedAt
                    ? new Date(verification.submittedAt).toLocaleString()
                    : "Not submitted"}
                </p>
              </div>
              {verification.reviewedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Reviewed At
                  </label>
                  <p>{new Date(verification.reviewedAt).toLocaleString()}</p>
                </div>
              )}
              {verification.reviewedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Reviewed By
                  </label>
                  <p className="text-xs text-gray-400 truncate">
                    {verification.reviewedBy}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p>{new Date(verification.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p>{new Date(verification.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {verification.status === "rejected" && verification.rejectionReason && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{verification.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
