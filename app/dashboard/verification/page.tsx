"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface VerificationStatus {
  status: "not_started" | "pending" | "under_review" | "approved" | "rejected";
  type: "kyc" | "kyb";
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  kycDocuments?: {
    idDocument?: string | null;
    addressProof?: string | null;
  };
  kybDocuments?: {
    registrationCertificate?: string | null;
    representativeId?: string | null;
    addressProof?: string | null;
    taxCertificate?: string | null;
  };
}

type DocumentType = "idDocument" | "addressProof" | "registrationCertificate" | "representativeId" | "taxCertificate";

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800", icon: Clock },
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800", icon: ShieldCheck },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function VerificationPage() {
  const { data: session } = useSession();
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/user/verification");
      if (response.ok) {
        const data = await response.json();
        setVerification(data.data);
      } else {
        console.error("Failed to fetch verification status");
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchVerificationStatus();
    }
  }, [session, fetchVerificationStatus]);

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    setUploading(documentType);

    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", file);

      const response = await fetch("/api/user/verification", {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        toast.success("Document uploaded successfully");
        fetchVerificationStatus();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/user/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success("Verification submitted successfully");
        fetchVerificationStatus();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to submit verification");
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    setSubmitting(true);

    try {
      const response = await fetch("/api/user/verification/resubmit", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Verification resubmitted successfully");
        fetchVerificationStatus();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to resubmit verification");
      }
    } catch (error) {
      console.error("Error resubmitting verification:", error);
      toast.error("Failed to resubmit verification");
    } finally {
      setSubmitting(false);
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

  const DocumentUploadCard = ({
    label,
    documentType,
    hasDocument,
    disabled,
  }: {
    label: string;
    documentType: DocumentType;
    hasDocument: boolean;
    disabled: boolean;
  }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const isUploading = uploading === documentType;

    return (
      <Card className={hasDocument ? "border-green-200 bg-green-50/50" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {label}
            {hasDocument && (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(documentType, file);
            }}
            disabled={disabled || isUploading}
          />

          {hasDocument ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-700">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm">Document uploaded</span>
              </div>
              {!disabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Replace"
                  )}
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
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
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Unable to load verification status</p>
        <Button onClick={fetchVerificationStatus} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const isKyb = verification.type === "kyb";
  const canEdit = verification.status === "not_started" || verification.status === "rejected";
  const canSubmit = verification.status === "not_started";
  const canResubmit = verification.status === "rejected";

  // Check if all required documents are uploaded
  const kycComplete = verification.kycDocuments?.idDocument && verification.kycDocuments?.addressProof;
  const kybComplete =
    verification.kybDocuments?.registrationCertificate &&
    verification.kybDocuments?.representativeId &&
    verification.kybDocuments?.addressProof &&
    verification.kybDocuments?.taxCertificate;
  const allDocumentsUploaded = isKyb ? kybComplete : kycComplete;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification</h1>
        <p className="text-gray-600 mt-1">
          Complete your {isKyb ? "KYB (Know Your Business)" : "KYC (Know Your Customer)"} verification to create campaigns
        </p>
      </div>

      {/* Status Banner */}
      <Card className={
        verification.status === "approved"
          ? "border-green-200 bg-green-50"
          : verification.status === "rejected"
            ? "border-red-200 bg-red-50"
            : verification.status === "pending" || verification.status === "under_review"
              ? "border-blue-200 bg-blue-50"
              : ""
      }>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {verification.status === "approved" ? (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              ) : verification.status === "rejected" ? (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              ) : verification.status === "pending" || verification.status === "under_review" ? (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-gray-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {verification.status === "approved"
                    ? "Verification Approved"
                    : verification.status === "rejected"
                      ? "Verification Rejected"
                      : verification.status === "pending"
                        ? "Verification Pending"
                        : verification.status === "under_review"
                          ? "Under Review"
                          : "Verification Required"}
                </h3>
                <p className="text-sm text-gray-600">
                  {verification.status === "approved"
                    ? "You can now create campaigns on the platform."
                    : verification.status === "rejected"
                      ? "Please review the feedback and resubmit your documents."
                      : verification.status === "pending" || verification.status === "under_review"
                        ? "Your documents are being reviewed. This usually takes 1-2 business days."
                        : "Upload the required documents to get verified."}
                </p>
              </div>
            </div>
            <StatusBadge status={verification.status} />
          </div>

          {/* Rejection Reason */}
          {verification.status === "rejected" && verification.rejectionReason && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Rejection Reason:</p>
                  <p className="text-red-700">{verification.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submitted/Reviewed dates */}
          {verification.submittedAt && (
            <div className="mt-4 text-sm text-gray-500">
              Submitted: {new Date(verification.submittedAt).toLocaleDateString()}
              {verification.reviewedAt && (
                <> | Reviewed: {new Date(verification.reviewedAt).toLocaleDateString()}</>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Required Documents
          </CardTitle>
          <CardDescription>
            {isKyb
              ? "Upload your organization's official documents"
              : "Upload your identification documents"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isKyb ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentUploadCard
                label="Registration Certificate"
                documentType="registrationCertificate"
                hasDocument={!!verification.kybDocuments?.registrationCertificate}
                disabled={!canEdit}
              />
              <DocumentUploadCard
                label="Representative ID"
                documentType="representativeId"
                hasDocument={!!verification.kybDocuments?.representativeId}
                disabled={!canEdit}
              />
              <DocumentUploadCard
                label="Address Proof"
                documentType="addressProof"
                hasDocument={!!verification.kybDocuments?.addressProof}
                disabled={!canEdit}
              />
              <DocumentUploadCard
                label="Tax Certificate"
                documentType="taxCertificate"
                hasDocument={!!verification.kybDocuments?.taxCertificate}
                disabled={!canEdit}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentUploadCard
                label="ID Document"
                documentType="idDocument"
                hasDocument={!!verification.kycDocuments?.idDocument}
                disabled={!canEdit}
              />
              <DocumentUploadCard
                label="Address Proof"
                documentType="addressProof"
                hasDocument={!!verification.kycDocuments?.addressProof}
                disabled={!canEdit}
              />
            </div>
          )}

          {/* Document Requirements Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Document Requirements:</h4>
            {isKyb ? (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Registration Certificate: Official NGO/Charity registration document</li>
                <li>• Representative ID: Valid ID of the authorized representative</li>
                <li>• Address Proof: Utility bill or bank statement (less than 3 months old)</li>
                <li>• Tax Certificate: Tax exemption or registration certificate</li>
              </ul>
            ) : (
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ID Document: National ID, passport, or driver&apos;s license</li>
                <li>• Address Proof: Utility bill or bank statement (less than 3 months old)</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {(canSubmit || canResubmit) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {canResubmit ? "Ready to resubmit?" : "Ready to submit?"}
                </p>
                <p className="text-sm text-gray-600">
                  {allDocumentsUploaded
                    ? "All required documents have been uploaded."
                    : "Please upload all required documents before submitting."}
                </p>
              </div>
              <Button
                onClick={canResubmit ? handleResubmit : handleSubmit}
                disabled={!allDocumentsUploaded || submitting}
                className="min-w-[150px]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : canResubmit ? (
                  "Resubmit for Review"
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
