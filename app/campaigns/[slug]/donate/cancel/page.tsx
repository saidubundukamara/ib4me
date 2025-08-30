import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { campaignService } from "@/services";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ donation_id?: string }>;
};

async function DonationCancelContent({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);
  if (!campaign) return notFound();

  // const donationId = searchParams.donation_id; // Future use

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center space-y-6">
        {/* Cancel Icon */}
        <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Cancel Message */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Donation Cancelled</h1>
          <p className="text-lg text-gray-600 mt-2">
            Your donation to {campaign.patient?.name || campaign.diagnosis || "this medical campaign"} was not completed.
          </p>
        </div>

        {/* Reason Info */}
        <div className="rounded-lg border bg-gray-50 p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">What happened?</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>Your donation was cancelled. This could happen for several reasons:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You chose to cancel the payment</li>
              <li>There was an issue with your payment method</li>
              <li>The payment session expired</li>
            </ul>
          </div>
        </div>

        {/* Encourage to Try Again */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your help is still needed!</h3>
          <p className="text-sm text-blue-800 mb-4">
            {campaign.patient?.name || "This patient"} still needs support. 
            Every donation, no matter the size, makes a difference.
          </p>
          <div className="text-xs text-blue-700">
            <div className="flex justify-between mb-1">
              <span>Raised so far:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: campaign.goal?.currency || "SLE",
                  minimumFractionDigits: 0
                }).format((campaign.totals?.raisedMinor || 0) / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Goal:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: campaign.goal?.currency || "SLE",
                  minimumFractionDigits: 0
                }).format((campaign.goal?.amountMinor || 0) / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            View Campaign
          </Link>
        </div>

        {/* Alternative Ways to Help */}
        <div className="pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">Other ways you can help:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-md border p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Share the Campaign</h4>
              <p className="text-gray-600 mb-3">Help spread the word to your friends and family</p>
              <div className="flex gap-2">
                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                  Facebook
                </button>
                <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                  WhatsApp
                </button>
              </div>
            </div>
            <div className="rounded-md border p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Contact Support</h4>
              <p className="text-gray-600 mb-3">Need help with your donation?</p>
              <button className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors">
                Get Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DonationCancelPage({ params }: PageProps) {
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
      <DonationCancelContent params={params} />
    </Suspense>
  );
}


