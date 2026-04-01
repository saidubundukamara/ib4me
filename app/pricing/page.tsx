"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Calculator, CheckCircle, Building2, User, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-provider";

const Pricing = () => {
    const [donationAmount, setDonationAmount] = useState(100);
    const [campaignType, setCampaignType] = useState<"individual" | "organization">("individual");

    // Get fee settings from context (fetched from API)
    const { fees, loading } = useSettings();

    // Fee constants (in basis points) - use API values with fallbacks
    const BASE_FEE_BPS = 100; // Monime's 1% - always fixed
    const PLATFORM_FEE_INDIVIDUAL_BPS = fees?.processingFee?.individualBps ?? 260;
    const PLATFORM_FEE_ORGANIZATION_BPS = fees?.processingFee?.organizationBps ?? 200;

    const amount = Math.max(0, Number(donationAmount) || 0);

    const platformFeeBps = campaignType === "individual" ? PLATFORM_FEE_INDIVIDUAL_BPS : PLATFORM_FEE_ORGANIZATION_BPS;

    const paymentFee = useMemo(() => Math.round(amount * BASE_FEE_BPS / 10000 * 100) / 100, [amount]);
    const platformFee = useMemo(() => Math.round(amount * platformFeeBps / 10000 * 100) / 100, [amount, platformFeeBps]);
    const totalFee = paymentFee + platformFee;
    const totalCharged = amount + totalFee;

    const paymentFeePercent = (BASE_FEE_BPS / 100).toFixed(1);
    const platformFeePercent = (platformFeeBps / 100).toFixed(1);
    const totalFeePercent = ((BASE_FEE_BPS + platformFeeBps) / 100).toFixed(1);


    return (
        <div className="min-h-screen bg-background font-Sora">
            {/* Hero Banner */}
            <section className="relative overflow-hidden bg-fun-green py-14 sm:py-18 lg:py-24">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl sm:h-96 sm:w-96" />
                    <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blaze-orange/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
                </div>
                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                        Simple, <span className="text-blaze-orange">Transparent</span> Pricing
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-white/80 sm:text-lg lg:text-xl">
                        We charge a small platform fee to keep our services running and help more people in need.
                    </p>
                </div>
                <div className="absolute -bottom-px left-0 right-0">
                    <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
                        <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" fill="white" />
                    </svg>
                </div>
            </section>

            <main>
                <div>
                    {/* Fee Structure */}
                    <section className="py-12 sm:py-16 lg:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6 sm:gap-8 lg:gap-12">
                                {/* Platform Fee */}
                                <Card className="h-full rounded-3xl border-0 p-6 shadow-[var(--shadow-lift)] sm:p-8">
                                    <div className="mb-5 flex items-center gap-3 sm:mb-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <span className="text-xs font-bold text-primary">SLL</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Fee Structure</h2>
                                    </div>

                                    <div className="space-y-5 sm:space-y-6">
                                        <div>
                                            <div className="mb-1.5 text-4xl font-bold text-blaze-orange sm:mb-2 sm:text-5xl">
                                                {loading ? <Skeleton className="h-10 w-24 sm:h-12" /> : `${totalFeePercent}%`}
                                            </div>
                                            <p className="text-sm text-muted-foreground sm:text-base">
                                                Total fee for {campaignType === "individual" ? "individual" : "organization"} campaigns. Donors cover the fees so 100% of the donation goes to the campaign.
                                            </p>
                                        </div>

                                        <div className="space-y-4 rounded-2xl bg-muted/50 p-5 sm:p-6">
                                            <h3 className="font-bold text-foreground">Fee breakdown:</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Payment processing (Monime)</span>
                                                    {loading ? <Skeleton className="h-5 w-12" /> : <span className="font-semibold text-foreground">{paymentFeePercent}%</span>}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Platform fee</span>
                                                    {loading ? <Skeleton className="h-5 w-12" /> : <span className="font-semibold text-foreground">{platformFeePercent}%</span>}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-border pt-3">
                                                    <span className="font-semibold text-foreground">Total</span>
                                                    {loading ? <Skeleton className="h-5 w-12" /> : <span className="font-bold text-blaze-orange">{totalFeePercent}%</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 rounded-2xl bg-muted/50 p-5 sm:p-6">
                                            <h3 className="mb-2.5 font-bold text-foreground sm:mb-3">What the fee covers:</h3>
                                            <div className="space-y-2.5 sm:space-y-3">
                                                {[
                                                    "Secure payment processing via Monime",
                                                    "Platform maintenance and development",
                                                    "24/7 customer support",
                                                    "Campaign verification and fraud protection",
                                                    "Marketing and outreach to help campaigns succeed",
                                                ].map((item) => (
                                                    <div key={item} className="flex items-start gap-3">
                                                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                                                        <span className="text-sm text-muted-foreground">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4">
                                            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                                            <p className="text-sm text-muted-foreground">
                                                <strong className="text-foreground">100% of your donation goes to the campaign.</strong> Fees are added on top and covered by donors.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Fee Calculator */}
                                <Card className="h-full rounded-3xl border-0 p-6 shadow-[var(--shadow-lift)] sm:p-8">
                                    <div className="mb-5 flex items-center gap-3 sm:mb-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blaze-orange/10">
                                            <Calculator className="h-6 w-6 text-blaze-orange" />
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Fee Calculator</h2>
                                    </div>

                                    <div className="space-y-5 sm:space-y-6">
                                        {/* Campaign Type Toggle */}
                                        <div>
                                            <Label className="mb-3 block text-base">Campaign Type</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setCampaignType("individual")}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                                                        campaignType === "individual"
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    <User className="h-4 w-4" />
                                                    Individual
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCampaignType("organization")}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                                                        campaignType === "organization"
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border hover:border-primary/50"
                                                    )}
                                                >
                                                    <Building2 className="h-4 w-4" />
                                                    Organization
                                                </button>
                                            </div>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Organizations get a reduced platform fee ({loading ? "…" : `${(PLATFORM_FEE_ORGANIZATION_BPS / 100).toFixed(1)}% vs ${(PLATFORM_FEE_INDIVIDUAL_BPS / 100).toFixed(1)}%`})
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="donation-amount" className="text-base">Enter Donation Amount</Label>
                                            <div className="relative mt-2">
                                                <span
                                                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 pr-3 text-lg font-bold text-muted-foreground sm:text-xl"
                                                    aria-hidden="true"
                                                >
                                                    SLL
                                                </span>
                                                <Input
                                                    id="donation-amount"
                                                    type="number"
                                                    min="1"
                                                    inputMode="decimal"
                                                    value={donationAmount}
                                                    onChange={(e) => setDonationAmount(Number(e.target.value) || 0)}
                                                    className="h-12 pl-14 pr-4 text-lg font-bold sm:h-14 sm:pl-16 sm:text-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 rounded-2xl bg-muted/50 p-5 sm:p-6">
                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <span className="text-muted-foreground">Donation Amount</span>
                                                <span className="text-lg font-bold text-foreground sm:text-xl">
                                                    SLL {amount.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <span className="text-muted-foreground">Payment Fee ({loading ? "…" : `${paymentFeePercent}%`})</span>
                                                {loading ? <Skeleton className="h-5 w-20" /> : (
                                                    <span className="font-semibold text-foreground">
                                                        SLL {paymentFee.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <span className="text-muted-foreground">Platform Fee ({loading ? "…" : `${platformFeePercent}%`})</span>
                                                {loading ? <Skeleton className="h-5 w-20" /> : (
                                                    <span className="font-semibold text-foreground">
                                                        SLL {platformFee.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <span className="font-semibold text-foreground">Total Donor Pays</span>
                                                {loading ? <Skeleton className="h-6 w-24" /> : (
                                                    <span className="text-lg font-bold text-blaze-orange sm:text-xl">
                                                        SLL {totalCharged.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="-mx-5 flex items-center justify-between rounded-b-xl bg-primary/5 px-5 py-3 pt-2 sm:-mx-6 sm:px-6">
                                                <span className="font-bold text-primary">Goes to Campaign</span>
                                                <span className="text-xl font-bold text-primary sm:text-2xl">
                                                    SLL {amount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Button size="lg" className="w-full" disabled={loading} asChild={!loading}>
                                                {loading ? <Skeleton className="h-5 w-32" /> : (
                                                    <Link href="/campaigns">
                                                        Donate SLL {totalCharged.toFixed(2)}
                                                    </Link>
                                                )}
                                            </Button>
                                            <p className="text-center text-xs text-muted-foreground">
                                                100% of your SLL {amount.toFixed(2)} donation goes to the campaign
                                            </p>
                                        </div>

                                        <div className="space-y-2 rounded-xl bg-success/5 p-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-success" />
                                                <span className="font-semibold text-foreground">Tax Deductible</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Your donation may be tax-deductible. You&#39;ll receive a receipt after your donation.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section className="space-y-0 divide-y divide-border rounded-3xl border bg-card shadow-[var(--shadow-soft)]">
                        <div className="grid grid-cols-1 items-start gap-6 p-6 md:grid-cols-2 sm:gap-8 sm:p-8 lg:gap-12">
                            <div>
                                <h3 className="font-Sora text-2xl font-bold sm:text-3xl lg:text-4xl">
                                    How do fees work?
                                </h3>
                            </div>
                            <div className="space-y-4 text-base leading-relaxed text-muted-foreground sm:space-y-5 sm:text-lg">
                                <p>
                                    Safe and secure fundraising is our top priority. That&#39;s why we partner with industry-leading
                                    payment processors like Monime to accept and deliver your donations.
                                </p>
                                <p>
                                    <strong className="text-foreground">Donors cover the fees</strong> so that 100% of every donation goes directly to the campaign.
                                    The small fee ({loading ? "…" : `${totalFeePercent}%`} for {campaignType} campaigns) is added on top of the donation amount and covers
                                    payment processing (1%) and platform costs ({loading ? "…" : `${platformFeePercent}%`}).
                                </p>
                                <p>
                                    <strong className="text-foreground">Campaign organizers pay nothing</strong> — starting a fundraiser on ib4me is completely free.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-6 p-6 md:grid-cols-2 sm:gap-8 sm:p-8 lg:gap-12">
                            <div>
                                <h3 className="font-Sora text-2xl font-bold sm:text-3xl lg:text-4xl">
                                    Why do organizations pay less?
                                </h3>
                            </div>
                            <div className="space-y-4 text-base leading-relaxed text-muted-foreground sm:space-y-5 sm:text-lg">
                                <p>
                                    Verified organizations benefit from a reduced platform fee of 2.0% (vs 2.6% for individuals),
                                    bringing their total fee to just 3.0%. This helps established organizations
                                    and NGOs maximize the impact of every donation they receive.
                                </p>
                                <p>
                                    <strong className="text-foreground">Organizations must complete verification</strong> to unlock the reduced fee rate.
                                    This ensures trust and accountability for larger fundraising campaigns.
                                </p>
                            </div>
                        </div>
                    </section>


                    {/* CTA Section */}
                    <div className="mx-auto mt-14 max-w-5xl rounded-3xl bg-primary px-6 py-8 text-center text-white sm:mt-18 sm:px-8 sm:py-10 md:px-12 md:py-12">
                        <h3 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl md:text-4xl">
                            Everything you need to fundraise
                        </h3>

                        <p className="mx-auto mb-6 max-w-2xl text-base text-white/90 sm:mb-8 sm:text-lg md:text-xl">
                            Ready to start a fundraiser? If you&#39;re looking for tips on successful fundraising or want to speak
                            to an ib4me team member, check out our Help Center.
                        </p>

                        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                            <Button size="lg" className="group bg-blaze-orange text-white hover:bg-blaze-orange/90" asChild>
                                <Link href="/dashboard">
                                    Start a Campaign
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Pricing;
