"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Heart, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type DonateClientProps = {
  slug: string;
  currency: string;
  title: string;
  organizerName?: string | null;
  progressPercent: number;
  amountRaised: number;
  goalAmount: number;
  imageUrl: string;
  processingFeeBps?: number; // Processing fee in basis points (e.g., 260 = 2.6%)
  isVerified?: boolean; // Whether campaign content is admin-verified
};

function formatAmount(amount: number, currency: string = "SLE") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const PRESET_AMOUNTS = [50, 250, 500];

export default function DonateClient({
  slug,
  currency,
  title,
  organizerName,
  progressPercent,
  amountRaised,
  goalAmount,
  imageUrl,
  processingFeeBps = 260, // Default 2.6%
  isVerified = false,
}: DonateClientProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(PRESET_AMOUNTS[1]);
  const [customAmount, setCustomAmount] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => {
    if (selectedPreset === "custom") {
      const parsed = Number.parseFloat(customAmount || "0");
      return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    }
    return selectedPreset;
  }, [selectedPreset, customAmount]);

  // Fee constants
  const BASE_FEE_BPS = 100; // Monime's 1% fee

  // Calculate base fee (Monime 1%)
  const baseFee = useMemo(() => {
    return Math.round(amount * BASE_FEE_BPS / 10000);
  }, [amount]);

  // Calculate processing fee (platform fee)
  const processingFee = useMemo(() => {
    return Math.round(amount * processingFeeBps / 10000);
  }, [amount, processingFeeBps]);

  // Total fees = base fee + processing fee
  const totalFee = baseFee + processingFee;

  const totalCharged = useMemo(() => {
    return amount + totalFee;
  }, [amount, totalFee]);

  const baseFeePercent = (BASE_FEE_BPS / 100).toFixed(1);
  const processingFeePercent = (processingFeeBps / 100).toFixed(1);
  const totalFeePercent = ((BASE_FEE_BPS + processingFeeBps) / 100).toFixed(1);

  const donateLabel = amount > 0 ? `Donate ${formatAmount(amount, currency)}` : "Enter amount";

  const handleDonateSubmit = async () => {
    setError(null);

    if (amount <= 0) {
      setError("Please enter a valid donation amount.");
      return;
    }

    if (!anonymous && (!firstName.trim() || !email.trim())) {
      setError("Please provide your name and email address.");
      return;
    }

    if (email && !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const donationData = {
        campaignSlug: slug,
        amount,
        currency,
        donor: anonymous
          ? undefined
          : {
              name: `${firstName.trim()} ${lastName.trim()}`.trim(),
              email: email.trim(),
            },
        isAnonymous: anonymous,
        message: message.trim() || undefined,
      };

      const response = await fetch("/api/donations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create donation");
      }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Donation creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to process donation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    amount > 0 && (anonymous || (firstName.trim() && email.trim()));

  return (
    <div className="font-Sora space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/40 shadow-xl">
            <Image
              src={imageUrl}
              alt={title}
              width={1600}
              height={900}
              className="size-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
          </div>

          <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Support this campaign
              </span>
              <CardTitle className="text-3xl font-bold text-foreground sm:text-4xl">
                {title}
              </CardTitle>
              {!isVerified && (
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 rounded-xl">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    This campaign is pending verification. Please review carefully before donating.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{organizerName ? `Organized by ${organizerName}` : "Campaign organizer"}</span>
                <span className="inline-flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  {formatAmount(amountRaised, currency)} raised of {formatAmount(goalAmount, currency)}
                </span>
              </div>
              <div>
                <Progress value={progressPercent} className="h-3" />
                <div className="mt-2 flex justify-between text-xs font-medium text-blaze-orange">
                  <span>{progressPercent}% funded</span>
                  <span>Goal {formatAmount(goalAmount, currency)}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Choose your donation
                </h2>
                <div className="grid gap-3 sm:grid-cols-4">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={selectedPreset === preset ? "default" : "outline"}
                      className={cn(
                        "h-12 rounded-2xl border-2 transition-all",
                        selectedPreset === preset
                          ? "border-primary shadow-lg"
                          : "border-border/60 hover:border-primary/60",
                      )}
                      onClick={() => setSelectedPreset(preset)}
                    >
                      {formatAmount(preset, currency)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={selectedPreset === "custom" ? "default" : "outline"}
                    className={cn(
                      "h-12 rounded-2xl border-2 transition-all",
                      selectedPreset === "custom"
                        ? "border-primary shadow-lg"
                        : "border-border/60 hover:border-primary/60",
                    )}
                    onClick={() => setSelectedPreset("custom")}
                  >
                    Custom amount
                  </Button>
                </div>
                {selectedPreset === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-amount">Enter amount</Label>
                    <Input
                      id="custom-amount"
                      type="number"
                      min={1}
                      step={1}
                      value={customAmount}
                      onChange={(event) => setCustomAmount(event.target.value)}
                      placeholder="Enter amount"
                      className="h-12 rounded-2xl border-border/50"
                    />
                  </div>
                )}
              </section>

              <Separator />

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Your details</h2>
                  <span className="inline-flex items-center gap-2 text-xs text-blaze-orange">
                    <Lock className="h-3.5 w-3.5" />
                    Secure donation
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      disabled={anonymous}
                      placeholder="Jane"
                      className="rounded-2xl border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      disabled={anonymous}
                      placeholder="Doe"
                      className="rounded-2xl border-border/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donor-email">Email address</Label>
                  <Input
                    id="donor-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={anonymous}
                    placeholder="you@example.com"
                    className="rounded-2xl border-border/50"
                  />
                  <p className="text-xs text-blaze-orange">
                    We&#39;ll send your receipt to this email.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Make this donation anonymous
                    </p>
                    <p className="text-xs text-blaze-orange">
                      Your name won&#39;t be displayed publicly on the campaign.
                    </p>
                  </div>
                  <Switch
                    checked={anonymous}
                    onCheckedChange={setAnonymous}
                    aria-label="Toggle anonymous donation"
                  />
                </div>
              </section>

              <Separator />

              <section className="space-y-2">
                <Label htmlFor="support-message">Message of support (optional)</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a kind note..."
                  rows={4}
                  className="rounded-2xl border-border/50"
                />
              </section>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  onClick={handleDonateSubmit}
                  disabled={isSubmitting || !isFormValid}
                  className="h-12 flex-1 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing…
                    </>
                  ) : (
                    donateLabel
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-xl">
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <Image
                  src={imageUrl}
                  alt={title}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-blaze-orange">
                    {organizerName ? `by ${organizerName}` : "Campaign organizer"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-blaze-orange">
                <div className="flex items-center justify-between">
                  <span>Campaign progress</span>
                  <span className="font-semibold text-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex items-center justify-between">
                  <span className="text-xs">Raised</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(amountRaised, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Goal</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(goalAmount, currency)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm text-blaze-orange">
                <div className="flex items-center justify-between">
                  <span>Your donation</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(amount, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment fee ({baseFeePercent}%)</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(baseFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Platform fee ({processingFeePercent}%)</span>
                  <span className="font-medium text-foreground">
                    {formatAmount(processingFee, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-semibold text-foreground">
                    {formatAmount(totalCharged, currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-primary/10 p-4 text-xs text-primary">
                <Lock className="mt-0.5 h-4 w-4" />
                <p>100% of your {formatAmount(amount, currency)} donation goes directly to this campaign.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
