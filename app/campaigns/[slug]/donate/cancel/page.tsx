import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { XCircle, Heart } from "lucide-react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa6";
import { campaignService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ donation_id?: string }>;
};

function formatAmount(amount: number, currency: string = "SLE") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function DonationCancelContent({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await campaignService.getBySlug(slug);
  if (!campaign) return notFound();

  const currency = campaign.goal?.currency || "SLE";
  const raisedMinor = campaign.totals?.raisedMinor ?? 0;
  const goalMinor = campaign.goal?.amountMinor ?? 0;
  const amountRaised = Math.max(0, Math.floor(raisedMinor) / 100);
  const goalAmount = Math.max(0, Math.floor(goalMinor) / 100);
  const progress = goalAmount > 0 ? Math.min(100, Math.round((amountRaised / goalAmount) * 100)) : 0;
  const campaignName = campaign.beneficiary?.name || campaign.details || "this campaign";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ib4me.org";
  const absoluteUrl = `${siteUrl}/campaigns/${slug}`;
  const shareText = `Help support ${campaignName} on ib4me`;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 font-Sora">
      <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Cancel Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/30">
              <XCircle className="h-10 w-10 text-blaze-orange" />
            </div>

            {/* Cancel Message */}
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Donation Cancelled</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Your donation to {campaignName} was not completed.
              </p>
            </div>

            {/* Reason Info */}
            <Card className="rounded-2xl border border-border/50 text-left">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">What happened?</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Your donation was cancelled. This could happen for several reasons:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>You chose to cancel the payment</li>
                    <li>There was an issue with your payment method</li>
                    <li>The payment session expired</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Encourage to Try Again */}
            <Card className="rounded-2xl border border-primary/20 bg-primary/5 text-left">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Your help is still needed!</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {campaignName} still needs support. Every donation, no matter the size, makes a difference.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Raised so far</span>
                    <span className="font-medium text-foreground">{formatAmount(amountRaised, currency)}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span>Goal</span>
                    <span className="font-medium text-foreground">{formatAmount(goalAmount, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="h-12 rounded-2xl flex-1">
                <Link href={`/campaigns/${slug}/donate`}>
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl flex-1">
                <Link href={`/campaigns/${slug}`}>
                  View Campaign
                </Link>
              </Button>
            </div>

            <Separator />

            {/* Share Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Other ways you can help</h3>
              <p className="text-sm text-muted-foreground">
                Even if you can&apos;t donate right now, sharing the campaign helps spread the word.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40"
                >
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                  >
                    <FaFacebookF className="mr-2 h-4 w-4" />
                    Facebook
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/40"
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${absoluteUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on WhatsApp"
                  >
                    <FaWhatsapp className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
              <div className="pt-2">
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <Link href="/contact">
                    Need help? Contact support
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function DonationCancelPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-2xl px-4 py-8 font-Sora">
        <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <Skeleton className="mx-auto h-16 w-16 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 mx-auto rounded-xl" />
                <Skeleton className="h-4 w-1/2 mx-auto rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <DonationCancelContent params={params} />
    </Suspense>
  );
}
