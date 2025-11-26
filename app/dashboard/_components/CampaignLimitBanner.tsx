"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, XCircle } from "lucide-react";

interface CampaignLimitBannerProps {
  currentCount: number;
  maxAllowed: number;
  userType: "individual" | "organization";
}

export default function CampaignLimitBanner({
  currentCount,
  maxAllowed,
  userType,
}: CampaignLimitBannerProps) {
  const remainingSlots = maxAllowed - currentCount;

  // Only show when near limit (1 or fewer slots remaining)
  if (remainingSlots > 1) {
    return null;
  }

  const isAtLimit = remainingSlots <= 0;
  const userLabel = userType === "organization" ? "organization" : "individual user";

  if (isAtLimit) {
    return (
      <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 rounded-xl">
        <XCircle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-800 dark:text-red-200">
          Campaign Limit Reached
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300">
          <p>
            You have reached your limit of {maxAllowed} active campaign{maxAllowed !== 1 ? "s" : ""} as an {userLabel}.
          </p>
          <p className="mt-2 text-sm">
            To create a new campaign, wait for an existing campaign to be completed or archived,
            or contact support if you need a higher limit.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning when 1 slot remaining
  return (
    <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-xl">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        1 Campaign Slot Remaining
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        You have {currentCount} of {maxAllowed} active campaign{maxAllowed !== 1 ? "s" : ""}.
        After creating one more campaign, you&apos;ll reach your limit as an {userLabel}.
      </AlertDescription>
    </Alert>
  );
}
