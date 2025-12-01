"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Info, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type DonationStatus = "loading" | "pending" | "transferring" | "succeeded" | "failed";

interface Campaign {
  patient?: { name?: string };
  diagnosis?: string;
}

interface SuccessClientProps {
  donationId: string;
  campaign: Campaign;
  slug: string;
  initialStatus?: string;
  errorMessage?: string;
}

// Map API status to display status
function mapStatus(apiStatus: string): DonationStatus {
  switch (apiStatus) {
    case "succeeded":
      return "succeeded";
    case "failed":
    case "error":
      return "failed";
    case "transferring":
    case "payment_received":
      return "transferring";
    case "pending":
      return "pending";
    default:
      return "loading";
  }
}

export default function SuccessClient({
  donationId,
  campaign,
  slug,
  initialStatus = "",
  errorMessage = "",
}: SuccessClientProps) {
  // Track window.location.origin safely for SSR
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const [status, setStatus] = useState<DonationStatus>(() => {
    // If we have an initial status from the API redirect, use it
    if (initialStatus) {
      return mapStatus(initialStatus);
    }
    // Otherwise, show loading until we check
    return donationId ? "loading" : "succeeded";
  });
  const [error, setError] = useState<string | null>(errorMessage || null);
  const [pollingCount, setPollingCount] = useState(0);
  const MAX_POLLING_ATTEMPTS = 30; // 60 seconds max polling

  const checkDonationStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/donations/${donationId}/status`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to check donation status");
      }
      return data.data;
    } catch (err) {
      console.error("Error checking donation status:", err);
      throw err;
    }
  }, [donationId]);

  useEffect(() => {
    // If we already have a terminal status from the API, don't poll
    if (initialStatus === "succeeded" || initialStatus === "failed" || initialStatus === "error") {
      return;
    }

    // If no donation ID, show success
    if (!donationId) {
      setStatus("succeeded");
      return;
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    // Only poll if status is pending or transferring (non-terminal)
    const shouldPoll = status === "loading" || status === "pending" || status === "transferring";

    if (!shouldPoll) {
      return;
    }

    async function checkAndUpdateStatus() {
      if (!isMounted) return;

      try {
        const donationData = await checkDonationStatus();

        if (!isMounted) return;

        if (donationData.status === "succeeded") {
          setStatus("succeeded");
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        if (donationData.status === "failed") {
          setStatus("failed");
          setError(donationData.failureReason || "Payment failed");
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        if (donationData.status === "payment_received") {
          setStatus("transferring");
        } else if (donationData.status === "pending") {
          setStatus("pending");
        }

        // Continue polling if not terminal
        setPollingCount((prev) => {
          if (prev >= MAX_POLLING_ATTEMPTS) {
            if (pollInterval) clearInterval(pollInterval);
            return prev;
          }
          return prev + 1;
        });
      } catch (err) {
        console.error("Polling error:", err);
        // Continue polling on transient errors
      }
    }

    // Initial check
    checkAndUpdateStatus();

    // Start polling
    pollInterval = setInterval(checkAndUpdateStatus, 2000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [donationId, initialStatus, status, checkDonationStatus]);

  const campaignName = campaign?.patient?.name || campaign?.diagnosis || "this medical campaign";

  // Loading state
  if (status === "loading") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Checking donation status...</h1>
                <p className="text-muted-foreground mt-2">Please wait while we verify your payment.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Pending state - waiting for payment confirmation
  if (status === "pending") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Processing your payment...</h1>
                <p className="text-muted-foreground mt-2">
                  Your payment is being processed. This usually takes just a few seconds.
                </p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  {pollingCount > 0 && pollingCount < MAX_POLLING_ATTEMPTS && (
                    <span>Checking status... ({Math.min(pollingCount * 2, 60)}s)</span>
                  )}
                  {pollingCount >= MAX_POLLING_ATTEMPTS && (
                    <span>This is taking longer than expected. You can refresh the page to check again.</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Transferring state - payment confirmed, moving funds
  if (status === "transferring") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Transferring funds...</h1>
                <p className="text-muted-foreground mt-2">
                  Payment confirmed! Transferring your donation to {campaignName}.
                </p>
              </div>
              {error && (
                <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 rounded-2xl text-left">
                  <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-sm">
                    <strong>Note:</strong> {error}. The transfer will be completed automatically.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Failed state
  if (status === "failed") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Payment Failed</h1>
                <p className="text-muted-foreground mt-2">Unfortunately, your payment could not be processed.</p>
              </div>
              {error && (
                <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 rounded-2xl text-left">
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
                    <strong>Reason:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button asChild className="h-12 rounded-2xl">
                  <Link href={`/campaigns/${slug}/donate`}>
                    Try Again
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-2xl">
                  <Link href={`/campaigns/${slug}`}>
                    Back to Campaign
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Success state
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500 dark:text-green-400" />
            </div>

            {/* Success Message */}
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Thank you for your donation!</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Your generous contribution to {campaignName} has been received.
              </p>
            </div>

            {/* Campaign Info */}
            <div className="rounded-2xl border border-border/40 bg-muted/30 p-6 text-left">
              <h3 className="font-semibold text-foreground mb-3">Donation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign:</span>
                  <span className="font-medium text-foreground">{campaignName}</span>
                </div>
                {donationId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Donation ID:</span>
                    <span className="font-mono text-xs text-foreground">{donationId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 rounded-2xl text-left">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-800 dark:text-blue-300">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    Your donation has been transferred to the campaign
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    You&apos;ll receive an email confirmation with your receipt
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    The campaign organizer has been notified of your contribution
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button asChild className="h-12 rounded-2xl">
                <Link href={`/campaigns/${slug}`}>
                  View Campaign
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl">
                <Link href="/campaigns">
                  Browse More Campaigns
                </Link>
              </Button>
            </div>

            <Separator />

            {/* Social Sharing */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span>Help spread the word about this campaign</span>
              </div>
              <div className="flex gap-4 justify-center">
                {origin && (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40"
                    >
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${origin}/campaigns/${slug}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Facebook
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/40"
                    >
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Help support ${campaignName}! ${origin}/campaigns/${slug}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
