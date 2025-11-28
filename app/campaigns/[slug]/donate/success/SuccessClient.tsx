"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type DonationStatus = "loading" | "pending" | "payment_received" | "transferring" | "succeeded" | "failed";

interface Campaign {
  patient?: { name?: string };
  diagnosis?: string;
}

interface SuccessClientProps {
  donationId: string;
  campaign: Campaign;
  slug: string;
}

export default function SuccessClient({ donationId, campaign, slug }: SuccessClientProps) {
  const [status, setStatus] = useState<DonationStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const MAX_POLLING_ATTEMPTS = 30; // 60 seconds max polling (2s intervals)

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

  const processTransfer = useCallback(async () => {
    try {
      const res = await fetch(`/api/donations/${donationId}/process-transfer`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok && res.status >= 500) {
        throw new Error(data.error || "Failed to process transfer");
      }

      return data;
    } catch (err) {
      console.error("Error processing transfer:", err);
      throw err;
    }
  }, [donationId]);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    async function handleDonation() {
      if (!donationId) {
        setStatus("succeeded"); // No donation ID, show generic success
        return;
      }

      try {
        // Step 1: Check current donation status
        const donationData = await checkDonationStatus();

        console.log("donationData from success client", donationData);

        if (!isMounted) return;

        if (donationData.status === "succeeded") {
          setStatus("succeeded");
          return;
        }

        if (donationData.status === "failed") {
          setStatus("failed");
          setError(donationData.failureReason || "Payment failed");
          return;
        }

        if (donationData.status === "payment_received") {
          // Step 2: Payment confirmed, trigger transfer
          setStatus("transferring");

          const transferResult = await processTransfer();

          if (!isMounted) return;

          if (transferResult.success || transferResult.status === "succeeded") {
            setStatus("succeeded");
            return;
          }

          if (transferResult.error) {
            // Transfer failed, but might be retryable
            setError(transferResult.error);
            // Still show as transferring and let webhook handle it
            return;
          }

          // Transfer in progress, will be handled by webhook
          return;
        }

        // Status is pending - payment not yet confirmed by Monime
        setStatus("pending");

        // Start polling for status updates
        const startPolling = () => {
          pollInterval = setInterval(async () => {
            if (!isMounted) {
              if (pollInterval) clearInterval(pollInterval);
              return;
            }

            setPollingCount(prev => {
              if (prev >= MAX_POLLING_ATTEMPTS) {
                if (pollInterval) clearInterval(pollInterval);
                return prev;
              }
              return prev + 1;
            });

            try {
              const updatedData = await checkDonationStatus();

              if (!isMounted) return;

              if (updatedData.status === "succeeded") {
                setStatus("succeeded");
                if (pollInterval) clearInterval(pollInterval);
                return;
              }

              if (updatedData.status === "failed") {
                setStatus("failed");
                setError(updatedData.failureReason || "Payment failed");
                if (pollInterval) clearInterval(pollInterval);
                return;
              }

              if (updatedData.status === "payment_received") {
                // Payment confirmed! Trigger transfer
                setStatus("transferring");
                if (pollInterval) clearInterval(pollInterval);

                const transferResult = await processTransfer();

                if (!isMounted) return;

                if (transferResult.success || transferResult.status === "succeeded") {
                  setStatus("succeeded");
                }
              }
            } catch (err) {
              console.error("Polling error:", err);
              // Continue polling on error
            }
          }, 2000); // Poll every 2 seconds
        };

        startPolling();
      } catch (err) {
        if (!isMounted) return;
        setStatus("failed");
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    }

    handleDonation();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [donationId, checkDonationStatus, processTransfer]);

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

  // Pending/Processing state - waiting for payment confirmation
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
            <p className="text-gray-600 mt-2">
              Unfortunately, your payment could not be processed.
            </p>
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
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}/campaigns/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 transition-colors"
            >
              Share on Facebook
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Help support ${campaignName}! ${typeof window !== "undefined" ? window.location.origin : ""}/campaigns/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700 transition-colors"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
