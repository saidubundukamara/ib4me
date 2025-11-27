"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Clock, XCircle } from "lucide-react";

interface VerificationRequiredBannerProps {
  verificationStatus: "not_started" | "pending" | "under_review" | "rejected";
  verificationType: "kyc" | "kyb";
  rejectionReason?: string;
}

export default function VerificationRequiredBanner({
  verificationStatus,
  verificationType,
  rejectionReason,
}: VerificationRequiredBannerProps) {
  const typeLabel = verificationType.toUpperCase();

  const config = {
    not_started: {
      icon: ShieldAlert,
      title: `${typeLabel} Verification Required`,
      description: `Complete identity verification to enable donations on your campaigns. This helps protect donors and ensures funds reach the right people.`,
      className: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
      iconClassName: "text-amber-500",
      titleClassName: "text-amber-800 dark:text-amber-200",
      descClassName: "text-amber-700 dark:text-amber-300",
    },
    pending: {
      icon: Clock,
      title: "Verification Pending",
      description: `Your ${typeLabel} verification is pending review. Donations will be enabled once approved (usually 1-2 business days).`,
      className: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
      iconClassName: "text-blue-500",
      titleClassName: "text-blue-800 dark:text-blue-200",
      descClassName: "text-blue-700 dark:text-blue-300",
    },
    under_review: {
      icon: Clock,
      title: "Verification Under Review",
      description: `Your ${typeLabel} verification is currently under review. Donations will be enabled once approved.`,
      className: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
      iconClassName: "text-blue-500",
      titleClassName: "text-blue-800 dark:text-blue-200",
      descClassName: "text-blue-700 dark:text-blue-300",
    },
    rejected: {
      icon: XCircle,
      title: "Verification Rejected",
      description: rejectionReason
        ? `Your verification was rejected: ${rejectionReason}. Please update your documents and resubmit.`
        : "Your verification was rejected. Please update your documents and resubmit.",
      className: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
      iconClassName: "text-red-500",
      titleClassName: "text-red-800 dark:text-red-200",
      descClassName: "text-red-700 dark:text-red-300",
    },
  };

  const {
    icon: Icon,
    title,
    description,
    className,
    iconClassName,
    titleClassName,
    descClassName,
  } = config[verificationStatus];

  return (
    <Alert className={`${className} rounded-xl`}>
      <Icon className={`h-4 w-4 ${iconClassName}`} />
      <AlertTitle className={titleClassName}>{title}</AlertTitle>
      <AlertDescription className={descClassName}>
        <p>{description}</p>
        <p className="mt-2 text-sm">
          <Link
            href="/dashboard/verification"
            className="underline font-medium hover:opacity-80"
          >
            {verificationStatus === "not_started"
              ? "Start verification"
              : "View verification status"}
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  );
}
