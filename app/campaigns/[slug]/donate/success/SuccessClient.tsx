"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Checking donation status...</h1>
            <p className="text-gray-600 mt-2">Please wait while we verify your payment.</p>
          </div>
        </div>
      </main>
    );
  }

  // Pending state - waiting for payment confirmation
  if (status === "pending") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-300 border-t-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Processing your payment...</h1>
            <p className="text-gray-600 mt-2">
              Your payment is being processed. This usually takes just a few seconds.
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              {pollingCount > 0 && pollingCount < MAX_POLLING_ATTEMPTS && (
                <span>Checking status... ({Math.min(pollingCount * 2, 60)}s)</span>
              )}
              {pollingCount >= MAX_POLLING_ATTEMPTS && (
                <span>This is taking longer than expected. You can refresh the page to check again.</span>
              )}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Transferring state - payment confirmed, moving funds
  if (status === "transferring") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Transferring funds...</h1>
            <p className="text-gray-600 mt-2">
              Payment confirmed! Transferring your donation to {campaignName}.
            </p>
          </div>
          {error && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> {error}. The transfer will be completed automatically.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Failed state
  if (status === "failed") {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Payment Failed</h1>
            <p className="text-gray-600 mt-2">Unfortunately, your payment could not be processed.</p>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left">
              <p className="text-sm text-red-800">
                <strong>Reason:</strong> {error}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/campaigns/${slug}/donate`}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-white hover:bg-gray-800 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href={`/campaigns/${slug}`}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Campaign
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Success state
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Thank you for your donation!</h1>
          <p className="text-lg text-gray-600 mt-2">
            Your generous contribution to {campaignName} has been received.
          </p>
        </div>

        {/* Campaign Info */}
        <div className="rounded-lg border bg-gray-50 p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Donation Details</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Campaign:</span>
              <span className="font-medium">{campaignName}</span>
            </div>
            {donationId && (
              <div className="flex justify-between">
                <span>Donation ID:</span>
                <span className="font-mono text-xs">{donationId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600 font-medium">Completed</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
              Your donation has been transferred to the campaign
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
              You&apos;ll receive an email confirmation with your receipt
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
              The campaign organizer has been notified of your contribution
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/campaigns/${slug}`}
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-white hover:bg-gray-800 transition-colors"
          >
            View Campaign
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Browse More Campaigns
          </Link>
        </div>

        {/* Social Sharing */}
        <div className="pt-6 border-t">
          <p className="text-sm text-gray-600 mb-4">Help spread the word about this campaign:</p>
          <div className="flex gap-4 justify-center">
            {origin && (
              <>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${origin}/campaigns/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 transition-colors"
                >
                  Share on Facebook
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Help support ${campaignName}! ${origin}/campaigns/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700 transition-colors"
                >
                  Share on WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
