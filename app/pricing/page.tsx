"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Calculator, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

const Pricing = () => {
    const [donationAmount, setDonationAmount] = useState(100);

    const amount = Math.max(0, Number(donationAmount) || 0);
    const platformFee = Number((amount * 0.01).toFixed(2));    
    const netToCampaign = Number((amount - platformFee).toFixed(2)); 
    const totalAmount = amount;                                   


    return (
        <div className="min-h-screen bg-background font-Sora">
            <main className="pt-24 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-10 sm:mb-14 space-y-3 sm:space-y-4">
                        <h1 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                            Simple, <span className="text-blaze-orange">Transparent</span> Pricing
                        </h1>
                        <p className="mx-auto max-w-2xl text-pretty text-base sm:text-lg lg:text-xl text-muted-foreground">
                            We charge a small platform fee to keep our services running and help more people in need.
                        </p>
                    </div>


                    {/* Fee Structure */}
                    <section className="py-12 sm:py-16 lg:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6 sm:gap-8 lg:gap-12">
                                {/* Platform Fee */}
                                <Card className="h-full rounded-3xl border-0 p-6 sm:p-8 shadow-[var(--shadow-lift)]">
                                    <div className="mb-5 sm:mb-6 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <div className="h-6 w-6 font-bold text-primary">SLE</div>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Platform Fee</h2>
                                    </div>

                                    <div className="space-y-5 sm:space-y-6">
                                        <div>
                                            <div className="mb-1.5 sm:mb-2 text-4xl sm:text-5xl font-bold text-blaze-orange">1%</div>
                                            <p className="text-sm sm:text-base text-muted-foreground">
                                                We charge only 1% of each donation to maintain our platform and services.
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-muted/50 p-5 sm:p-6 space-y-3">
                                            <h3 className="mb-2.5 sm:mb-3 font-bold text-foreground">What the fee covers:</h3>
                                            <div className="space-y-2.5 sm:space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                                                    <span className="text-sm text-muted-foreground">Platform maintenance and development</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                                                    <span className="text-sm text-muted-foreground">24/7 customer support</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                                                    <span className="text-sm text-muted-foreground">Campaign verification and fraud protection</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                                                    <span className="text-sm text-muted-foreground">Secure payment processing</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                                                    <span className="text-sm text-muted-foreground">Marketing and outreach to help campaigns succeed</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-xl bg-blaze-orange/5 p-4">
                                            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blaze-orange" />
                                            <p className="text-sm text-muted-foreground">
                                                Unlike other platforms, we don&#39;t charge any additional fees for withdrawals or payment processing.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Fee Calculator */}
                                <Card className="h-full rounded-3xl border-0 p-6 sm:p-8 shadow-[var(--shadow-lift)]">
                                    <div className="mb-5 sm:mb-6 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blaze-orange/10">
                                            <Calculator className="h-6 w-6 text-blaze-orange" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Fee Calculator</h2>
                                    </div>

                                    <div className="space-y-5 sm:space-y-6">
                                        <div>
                                            <Label htmlFor="donation-amount" className="text-base">Enter Donation Amount</Label>
                                            <div className="relative mt-2">
                                                <span
                                                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 pr-3 text-lg sm:text-xl font-bold text-muted-foreground"
                                                    aria-hidden="true"
                                                >
                                                    SLE
                                                </span>
                                                <Input
                                                    id="donation-amount"
                                                    type="number"
                                                    min="1"
                                                    inputMode="decimal"
                                                    value={donationAmount}
                                                    onChange={(e) => setDonationAmount(Number(e.target.value) || 0)}
                                                    className="h-12 sm:h-14 pl-14 sm:pl-16 pr-4 text-lg sm:text-xl font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-muted/50 p-5 sm:p-6 space-y-4">
                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <span className="text-muted-foreground">Donation Amount</span>
                                                <span className="text-lg sm:text-xl font-bold text-foreground">
                                                    SLE{donationAmount.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <span className="text-muted-foreground">Platform Fee (1%)</span>
                                                <span className="text-lg sm:text-xl font-bold text-blaze-orange">
                                                    SLE{platformFee.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <span className="font-bold text-foreground">Goes to Campaign</span>
                                                <span className="text-xl sm:text-2xl font-bold text-primary">
                                                    SLE{netToCampaign.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Button size="lg" className="w-full">
                                                Donate SLE{totalAmount.toFixed(2)}
                                            </Button>
                                            <p className="text-center text-xs text-muted-foreground">
                                                SLE{netToCampaign.toFixed(2)} goes to the campaign organizer
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
                    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-16">
                        <div>
                            <h3 className="font-Lora text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-6">
                                What&#39;s a transaction fee?
                            </h3>
                        </div>
                        <div className="space-y-4 sm:space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
                            <p>
                                Safe and secure fundraising is our top priority. That&#39;s why we partner with industry-leading
                                payment processors like Monime to accept and deliver your donations.
                            </p>
                            <p>
                                The transaction fee is automatically deducted from each donation. It covers the costs of credit,
                                debit, and Local Payments platforms, safely delivering donations, and helps us offer more ways to donate,
                                through credit, debit, PayPal, or Local payments platforms. <strong>This is the only fee deducted for
                                    someone starting a fundraiser on ib4me</strong> and helps power all your fundraising needs.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-16">
                        <div>
                            <h3 className="font-Lora text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-6">
                                Donor contributions to ib4me are always optional
                            </h3>
                        </div>
                        <div className="space-y-4 sm:space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
                            <p>
                                It&#39;s important to us that everyone is able to get the help they need, which is why we don&#39;t charge
                                a fee to start a fundraiser. Instead, we accept optional contributions from donors that are always
                                appreciated, but never required. Donor contributions help make it possible for us to offer powerful
                                and trusted fundraising tools, customer support, and a global team of Trust &amp; Safety experts.
                            </p>
                        </div>
                    </div>


                    {/* CTA Section */}
                    <div className="mx-auto max-w-5xl rounded-3xl bg-primary/80 px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 text-center text-white">
                        <h3 className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl font-bold">
                            Everything you need to fundraise
                        </h3>

                        <p className="mx-auto mb-6 sm:mb-8 max-w-2xl text-base sm:text-lg md:text-xl text-white/90">
                            Ready to start a fundraiser? If you&#39;re looking for tips on successful fundraising or want to speak
                            to an ib4me team member, check out our Help Center.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                            <Link href="/create-campaign" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto bg-blaze-orange text-white hover:bg-blaze-orange/90">
                                    Start a Campaign
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
};

export default Pricing;
