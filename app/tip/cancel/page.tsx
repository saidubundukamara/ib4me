import { Suspense } from "react";
import Link from "next/link";
import { XCircle, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ tip_id?: string }>;
};

async function TipCancelContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tipId = resolvedSearchParams.tip_id;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center space-y-8">
        {/* Cancel Icon */}
        <div className="mx-auto h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
          <XCircle className="h-12 w-12 text-orange-500" />
        </div>

        {/* Cancel Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Tip Cancelled</h1>
          <p className="text-lg text-gray-600">
            Your tip to IB4ME was not completed.
          </p>
        </div>

        {/* Reason Info */}
        <Card className="rounded-3xl border border-border/40 shadow-lg">
          <CardContent className="p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">What happened?</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Your tip was cancelled. This could happen for several reasons:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You chose to cancel the payment</li>
                <li>There was an issue with your payment method</li>
                <li>The payment session expired</li>
              </ul>
            </div>
            {tipId && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-xs">{tipId}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Encourage to Try Again */}
        <Card className="rounded-3xl border border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-900 mb-3">
              <Heart className="h-5 w-5" />
              <span className="font-semibold">Your support still matters!</span>
            </div>
            <p className="text-sm text-blue-800">
              IB4ME helps connect patients in Sierra Leone with donors who can fund their
              medical emergencies. Every tip helps us maintain and improve the platform.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="rounded-2xl h-12 px-8">
            <Link href="/tip">
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-8">
            <Link href="/campaigns">
              Browse Campaigns
            </Link>
          </Button>
        </div>

        {/* Alternative Ways to Help */}
        <div className="pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">Other ways you can help:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Donate to a Campaign</h4>
                <p className="text-gray-600 mb-3">
                  Support patients directly by donating to their medical campaigns.
                </p>
                <Button asChild variant="secondary" size="sm" className="rounded-lg">
                  <Link href="/campaigns">View Campaigns</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Share IB4ME</h4>
                <p className="text-gray-600 mb-3">
                  Help spread the word about IB4ME to your network.
                </p>
                <div className="flex gap-2">
                  <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                    Facebook
                  </button>
                  <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                    WhatsApp
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TipCancelPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-gray-200" />
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            </div>
          </div>
        </div>
      }
    >
      <TipCancelContent searchParams={searchParams} />
    </Suspense>
  );
}
