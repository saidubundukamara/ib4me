import { Suspense } from "react";
import { campaignService } from "@/services";
import SuccessClient from "./SuccessClient";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ donation_id?: string; session_id?: string; status?: string; message?: string }>;
};

async function DonationSuccessContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const donationId = resolvedSearchParams.donation_id || "";
  const initialStatus = resolvedSearchParams.status || "";
  const errorMessage = resolvedSearchParams.message || "";

  // Try to fetch campaign data
  let campaign = null;
  try {
    campaign = await campaignService.getBySlug(slug);
  } catch (error) {
    console.error(`[success-page] Error fetching campaign ${slug}:`, error);
  }

  // If no campaign found, still show success page with minimal info
  // The SuccessClient will handle showing appropriate content
  const campaignData = campaign
    ? {
        patient: campaign.patient ? { name: campaign.patient.name } : undefined,
        diagnosis: campaign.diagnosis,
      }
    : {
        patient: undefined,
        diagnosis: "the medical campaign",
      };

  return (
    <SuccessClient
      donationId={donationId}
      campaign={campaignData}
      slug={slug}
      initialStatus={initialStatus}
      errorMessage={errorMessage}
    />
  );
}

export default function DonationSuccessPage({ params, searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <DonationSuccessContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
