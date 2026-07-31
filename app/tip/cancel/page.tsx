import { Suspense } from "react";
import Link from "next/link";
import { Heart, XCircle } from "lucide-react";
import Ib4meContentLoader from "@/components/Ib4meContentLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ tip_id?: string }>;
};

async function TipCancelContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tipId = resolvedSearchParams.tip_id;

  return (
    <>
      {/* Green wave hero */}
      <section className="relative overflow-hidden bg-fun-green py-14 sm:py-20 px-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blaze-orange/10 translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full mb-5 text-sm font-semibold">
            <XCircle className="w-4 h-4" />
            Payment Cancelled
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Tip <span className="text-blaze-orange">Cancelled</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            No worries — your tip was not completed. You can try again anytime.
          </p>
        </div>
        <div className="absolute -bottom-px left-0 right-0" aria-hidden="true">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
            <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" className="fill-background" />
          </svg>
        </div>
      </section>

      <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center space-y-8">

        {/* Reason Info */}
        <Card className="rounded-3xl border border-border/40 shadow-lg">
          <CardContent className="p-6 text-left">
            <h3 className="font-semibold text-foreground mb-3">What happened?</h3>
            <div className="text-sm text-muted-foreground space-y-2">
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
        <Card className="rounded-3xl border border-border/40">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-foreground mb-3">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold">Your support still matters!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ib4me helps connect people in Sierra Leone with donors who can fund their
              causes. Every tip helps us maintain and improve the platform.
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
          <h3 className="font-semibold text-foreground mb-4">Other ways you can help:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-left">
                <h4 className="font-medium text-foreground mb-2">Donate to a Campaign</h4>
                <p className="text-muted-foreground mb-3">
                  Support people directly by donating to their campaigns.
                </p>
                <Button asChild variant="secondary" size="sm" className="rounded-xl">
                  <Link href="/campaigns">View Campaigns</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-left">
                <h4 className="font-medium text-foreground mb-2">Share ib4me</h4>
                <p className="text-muted-foreground mb-3">
                  Help spread the word about ib4me to your network.
                </p>
                <div className="flex gap-2">
                  <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors">
                    Facebook
                  </button>
                  <button className="text-xs bg-blaze-orange text-white px-3 py-1.5 rounded-xl hover:bg-blaze-orange/90 transition-colors">
                    WhatsApp
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}

export default function TipCancelPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Ib4meContentLoader />
        </div>
      }
    >
      <TipCancelContent searchParams={searchParams} />
    </Suspense>
  );
}
