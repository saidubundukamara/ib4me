import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { campaignService } from "@/services";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ donation_id?: string; session_id?: string }>;
};

async function DonationSuccessContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);
  if (!campaign) return notFound();

  const resolvedSearchParams = await searchParams;
  const donationId = resolvedSearchParams.donation_id;
  // const sessionId = resolvedSearchParams.session_id; // Future use

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
            Your generous contribution to {campaign.patient?.name || campaign.diagnosis || "this medical campaign"} has been received.
          </p>
        </div>

        {/* Campaign Info */}
        <div className="rounded-lg border bg-gray-50 p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Campaign Details</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Campaign:</span>
              <span className="font-medium">{campaign.patient?.name || campaign.diagnosis}</span>
            </div>
            {donationId && (
              <div className="flex justify-between">
                <span>Donation ID:</span>
                <span className="font-mono text-xs">{donationId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-green-600 font-medium">Processing</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
              Your donation is being processed and will be confirmed shortly
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
              You&apos;ll receive an email confirmation with your receipt
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
              The campaign organizer will be notified of your contribution
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
            <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 transition-colors">
              Share on Facebook
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700 transition-colors">
              Share on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DonationSuccessPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-200" />
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    }>
      <DonationSuccessContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}


