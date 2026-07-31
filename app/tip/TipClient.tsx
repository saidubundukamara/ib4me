"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Lock, Loader2, ArrowLeft } from "lucide-react";
import Ib4meContentLoader from "@/components/Ib4meContentLoader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatMinor } from "@/lib/currency";

interface TippingSettings {
  enabled: boolean;
  suggestedAmounts: number[];
  minAmountMinor: number;
  maxAmountMinor: number;
}

export type TipClientProps = {
  /**
   * Preselected amount in MINOR units, from `?amount=` on the URL.
   *
   * Advisory only. It is validated against the configured min/max below, and
   * `/api/tips/create` re-validates server-side regardless, so a tampered value can only
   * fail closed. Nothing about the donor is ever passed through the URL.
   */
  initialAmountMinor?: number | null;
  /** Which surface sent the donor here. Sent with the tip so the CTA can be measured. */
  source?: "tip_page" | "donation_success";
};

export default function TipClient({
  initialAmountMinor = null,
  source = "tip_page",
}: TipClientProps) {
  const [settings, setSettings] = useState<TippingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<number | "custom">("custom");
  const [customAmount, setCustomAmount] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currency = "SLE";

  // Fetch tipping settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/tips/settings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load settings");
        }

        if (!data.enabled) {
          setError("Platform tipping is currently disabled.");
          return;
        }

        setSettings(data);

        // Honour ?amount= when it is within the configured bounds — this is how the
        // thank-you-page CTA hands a donor over with their chosen amount intact. Anything
        // out of range falls back to the default rather than being silently clamped.
        const withinBounds =
          initialAmountMinor !== null &&
          Number.isFinite(initialAmountMinor) &&
          initialAmountMinor >= data.minAmountMinor &&
          initialAmountMinor <= data.maxAmountMinor;

        if (withinBounds) {
          if (data.suggestedAmounts?.includes(initialAmountMinor)) {
            setSelectedPreset(initialAmountMinor as number);
          } else {
            setSelectedPreset("custom");
            setCustomAmount(((initialAmountMinor as number) / 100).toFixed(2));
          }
        } else if (data.suggestedAmounts?.length > 0) {
          setSelectedPreset(data.suggestedAmounts[1] || data.suggestedAmounts[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tipping settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [initialAmountMinor]);

  // Calculate the amount in minor units
  const amountMinor = (() => {
    if (selectedPreset === "custom") {
      const parsed = Number.parseFloat(customAmount || "0");
      return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed * 100)) : 0;
    }
    return selectedPreset;
  })();

  // Amount in major units for display
  const amountMajor = amountMinor / 100;

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!settings) return;

    if (amountMinor < settings.minAmountMinor) {
      setSubmitError(`Minimum tip amount is ${formatMinor(settings.minAmountMinor, currency)}`);
      return;
    }

    if (amountMinor > settings.maxAmountMinor) {
      setSubmitError(`Maximum tip amount is ${formatMinor(settings.maxAmountMinor, currency)}`);
      return;
    }

    if (!anonymous && !name.trim()) {
      setSubmitError("Please provide your name or choose to tip anonymously.");
      return;
    }

    if (email && !email.includes("@")) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tipData = {
        amount: amountMajor, // API expects major units
        currency,
        tipper: anonymous
          ? undefined
          : {
              name: name.trim(),
              email: email.trim() || undefined,
            },
        isAnonymous: anonymous,
        message: message.trim() || undefined,
        source,
      };

      const response = await fetch("/api/tips/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tipData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create tip");
      }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Tip creation error:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to process tip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    amountMinor > 0 &&
    settings &&
    amountMinor >= settings.minAmountMinor &&
    amountMinor <= settings.maxAmountMinor &&
    (anonymous || name.trim());

  if (loading) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <Ib4meContentLoader />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="rounded-3xl border border-border/40 shadow-xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Tipping Unavailable</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="space-y-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Support ib4me</h1>
          <p className="text-muted-foreground">
            Your tip helps us maintain the platform and support more campaigns in Sierra Leone.
          </p>
        </div>

        {/* Tip Form */}
        <Card className="rounded-3xl border border-border/40 shadow-xl">
          <CardHeader>
            <CardTitle>Leave a Tip</CardTitle>
            <CardDescription>
              100% of your tip goes directly to supporting ib4me&apos;s mission.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Amount Selection */}
            <section className="space-y-3">
              <Label className="text-base font-semibold">Choose your tip amount</Label>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                {settings?.suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={selectedPreset === amount ? "default" : "outline"}
                    className={cn(
                      "h-12 rounded-2xl border-2 transition-all",
                      selectedPreset === amount
                        ? "border-primary shadow-lg"
                        : "border-border/60 hover:border-primary/60"
                    )}
                    onClick={() => setSelectedPreset(amount)}
                  >
                    {formatMinor(amount, currency)}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant={selectedPreset === "custom" ? "default" : "outline"}
                className={cn(
                  "w-full h-12 rounded-2xl border-2 transition-all",
                  selectedPreset === "custom"
                    ? "border-primary shadow-lg"
                    : "border-border/60 hover:border-primary/60"
                )}
                onClick={() => setSelectedPreset("custom")}
              >
                Custom amount
              </Button>
              {selectedPreset === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Enter amount ({currency})</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    min={settings ? settings.minAmountMinor / 100 : 1}
                    max={settings ? settings.maxAmountMinor / 100 : 100000}
                    step={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-12 rounded-2xl border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Min: {formatMinor(settings?.minAmountMinor || 100, currency)} •
                    Max: {formatMinor(settings?.maxAmountMinor || 10000000, currency)}
                  </p>
                </div>
              )}
            </section>

            <Separator />

            {/* Tipper Details */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Your details</Label>
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Secure payment
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipper-name">Name</Label>
                <Input
                  id="tipper-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={anonymous}
                  placeholder="Your name"
                  className="rounded-2xl border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipper-email">Email (optional)</Label>
                <Input
                  id="tipper-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={anonymous}
                  placeholder="you@example.com"
                  className="rounded-2xl border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send your receipt to this email.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Tip anonymously</p>
                  <p className="text-xs text-muted-foreground">
                    Your name won&apos;t be recorded or displayed.
                  </p>
                </div>
                <Switch
                  checked={anonymous}
                  onCheckedChange={setAnonymous}
                  aria-label="Toggle anonymous tip"
                />
              </div>
            </section>

            <Separator />

            {/* Message */}
            <section className="space-y-2">
              <Label htmlFor="tip-message">Message (optional)</Label>
              <Textarea
                id="tip-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a message of support..."
                rows={3}
                className="rounded-2xl border-border/50"
              />
            </section>

            {/* Error Display */}
            {submitError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Summary */}
            <div className="rounded-2xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Your tip</span>
                <span className="font-medium">{formatMinor(amountMinor, currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-lg">{formatMinor(amountMinor, currency)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Tip {formatMinor(amountMinor, currency)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secured by Monime • Encrypted checkout
            </p>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="rounded-3xl border border-border/40">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Why tip ib4me?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2" />
                Help us maintain and improve the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2" />
                Support our team in verifying campaigns
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2" />
                Enable us to reach more people in need across Sierra Leone
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
