"use client";

import React from "react";
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
import { ShieldCheck } from "lucide-react";

interface VerificationRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verificationStatus: "not_started" | "pending" | "under_review" | "rejected";
  verificationType: "kyc" | "kyb";
  onGoToVerification: () => void;
}

const statusMessages = {
  not_started:
    "You need to complete identity verification to enable donations on your campaign. This protects donors and ensures funds are handled responsibly.",
  pending:
    "Your verification documents are being reviewed. Donations will be enabled once approved.",
  under_review:
    "Your verification is currently under review. Donations will be enabled once approved.",
  rejected:
    "Your verification was rejected. Please review and resubmit your documents to enable donations.",
};

export default function VerificationRequiredModal({
  open,
  onOpenChange,
  verificationStatus,
  verificationType,
  onGoToVerification,
}: VerificationRequiredModalProps) {
  const typeLabel = verificationType === "kyb" ? "Business" : "Identity";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-[min(100vw-2rem,420px)] rounded-3xl border border-border/40 bg-card/95 p-0 shadow-2xl">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle>{typeLabel} Verification Required</AlertDialogTitle>
            <AlertDialogDescription>
              {statusMessages[verificationStatus]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onGoToVerification} className="rounded-2xl">
              {verificationStatus === "not_started"
                ? "Start Verification"
                : "View Verification"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
