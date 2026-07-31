import { Suspense } from "react";
import Link from "next/link";
import { Heart, CheckCircle2 } from "lucide-react";
import Ib4meContentLoader from "@/components/Ib4meContentLoader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ tip_id?: string; session_id?: string }>;
};

async function TipSuccessContent({ searchParams }: PageProps) {
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
            <CheckCircle2 className="w-4 h-4" />
            Payment Received
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Thank <span className="text-blaze-orange">You!</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            Your generous tip to ib4me has been received.
          </p>
        </div>
        <div className="absolute -bottom-px left-0 right-0" aria-hidden="true">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
            <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" className="fill-background" />
          </svg>
        </div>
      </section>

      <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="space-y-8">

        {/* Info Card */}
        <Card className="rounded-3xl border border-border/40 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-5 w-5" />
              <span className="font-medium">Your support means everything</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Your tip helps us continue our mission of connecting people in Sierra Leone
              with donors who can help fund their causes.
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
        <Card className="rounded-3xl border border-border/40">
          <CardContent className="p-6 text-left">
            <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2" />
                Your tip is being processed and will be confirmed shortly
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2" />
                Keep the reference above if you need to ask us about this tip
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2" />
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
            <button className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-white text-sm hover:bg-primary/90 transition-colors">
              Share on Facebook
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-blaze-orange px-4 py-2 text-white text-sm hover:bg-blaze-orange/90 transition-colors">
              Share on WhatsApp
            </button>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}

export default function TipSuccessPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Ib4meContentLoader />
        </div>
      }
    >
      <TipSuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
