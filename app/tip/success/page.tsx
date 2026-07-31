import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
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
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Thank You!</h1>
          <p className="text-lg text-muted-foreground">
            Your generous tip to ib4me has been received.
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
            <Link href="/campaigns">Browse Campaigns</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-8">
            <Link href="/">Back to Home</Link>
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
