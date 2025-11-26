import { Suspense } from "react";
import Link from "next/link";
import { Heart, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ tip_id?: string; session_id?: string }>;
};

async function TipSuccessContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tipId = resolvedSearchParams.tip_id;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center space-y-8">
        {/* Success Icon */}
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Thank You!</h1>
          <p className="text-lg text-gray-600">
            Your generous tip to IB4ME has been received.
          </p>
        </div>

        {/* Info Card */}
        <Card className="rounded-3xl border border-border/40 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="font-medium">Your support means everything</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Your tip helps us continue our mission of connecting patients in Sierra Leone
              with donors who can help fund their medical emergencies.
            </p>

            {tipId && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-xs">{tipId}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="rounded-3xl border border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
                Your tip is being processed and will be confirmed shortly
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
                If you provided an email, you&apos;ll receive a confirmation receipt
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2" />
                Your contribution will go directly towards supporting the platform
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="rounded-2xl h-12 px-8">
            <Link href="/campaigns">
              Browse Campaigns
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-8">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Social Sharing */}
        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Help us reach more people in need:
          </p>
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

export default function TipSuccessPage({ searchParams }: PageProps) {
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
      <TipSuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
