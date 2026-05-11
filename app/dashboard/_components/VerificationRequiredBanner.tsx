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
      title: `Complete ${typeLabel} Verification`,
      description: `Complete identity verification to earn a verified badge on your campaigns. This builds trust with donors and helps your campaigns stand out.`,
      className: "bg-orange-50 dark:bg-orange-950/20 border-blaze-orange/30 dark:border-blaze-orange/20",
      iconClassName: "text-blaze-orange",
      titleClassName: "text-orange-800 dark:text-orange-200",
      descClassName: "text-orange-700 dark:text-orange-300",
    },
    pending: {
      icon: Clock,
      title: "Verification Pending",
      description: `Your ${typeLabel} verification is pending review. Your campaigns are live but will show a verified badge once approved (usually 1-2 business days).`,
      className: "bg-green-50 dark:bg-green-950/20 border-primary/30 dark:border-primary/20",
      iconClassName: "text-primary",
      titleClassName: "text-green-800 dark:text-green-200",
      descClassName: "text-green-700 dark:text-green-300",
    },
    under_review: {
      icon: Clock,
      title: "Verification Under Review",
      description: `Your ${typeLabel} verification is currently under review. Your campaigns are live and will display a verified badge once approved.`,
      className: "bg-green-50 dark:bg-green-950/20 border-primary/30 dark:border-primary/20",
      iconClassName: "text-primary",
      titleClassName: "text-green-800 dark:text-green-200",
      descClassName: "text-green-700 dark:text-green-300",
    },
    rejected: {
      icon: XCircle,
      title: "Verification Rejected",
      description: rejectionReason
        ? `Your verification was rejected: ${rejectionReason}. Please update your documents and resubmit to earn a verified badge.`
        : "Your verification was rejected. Please update your documents and resubmit to earn a verified badge.",
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
