"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus, DollarSign, Heart, CheckCircle,
  Users, ArrowRight, Lock, Eye,
  Globe, Share2, Wallet,
} from "lucide-react";
import { usePlatformStats, getStatItems, StatItem } from "../_components/LiveStatsGrid";
import Link from "next/link";

const creatorSteps = [
  {
    icon: UserPlus,
    title: "Create Your Campaign",
    description: "Sign up and set up your fundraising campaign in minutes.",
    details: [
      "Create a free account",
      "Upload supporting documents and photos",
      "Set your fundraising goal",
      "Tell your story to connect with donors",
    ],
    color: "bg-fun-green",
    accent: "text-fun-green",
  },
  {
    icon: Share2,
    title: "Share & Fundraise",
    description:
      "Your campaign goes live instantly. Share it and start receiving support.",
    details: [
      "Campaign goes live on our platform right away",
      "Share with family, friends, and social media",
      "Receive donations from our community",
      "Keep donors updated on your progress",
    ],
    color: "bg-blaze-orange",
    accent: "text-blaze-orange",
  },
  {
    icon: Wallet,
    title: "Receive Funds",
    description:
      "Funds are securely transferred directly to you or your beneficiary.",
    details: [
      "Direct payment to beneficiaries",
      "Real-time fund tracking",
      "Transparent fee structure",
      "Secure, encrypted transactions",
    ],
    color: "bg-fun-green",
    accent: "text-fun-green",
  },
];

const donorSteps = [
  {
    icon: Heart,
    number: "01",
    title: "Browse Campaigns",
    description:
      "Explore campaigns from people and communities across Sierra Leone",
  },
  {
    icon: Users,
    number: "02",
    title: "Choose Your Impact",
    description: "Select campaigns that resonate with your values",
  },
  {
    icon: DollarSign,
    number: "03",
    title: "Donate Securely",
    description:
      "Safe, encrypted payments processed through trusted providers",
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Stay Connected",
    description: "Receive updates on the people you've helped",
  },
];

const trustItems = [
  {
    icon: Globe,
    title: "Open Platform",
    description: "Anyone can create a campaign and start fundraising right away",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description:
      "Industry-standard encryption protects your financial information",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Track exactly how funds are used with regular updates",
  },
];

const HowItWorks = () => {
  const platformData = usePlatformStats();
  const stats = getStatItems(platformData);

  return (
    <div className="font-Sora">
      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-fun-green px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 sm:-right-24 sm:-top-24 sm:h-72 sm:w-72" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 sm:h-56 sm:w-56" />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur sm:text-sm">
              Simple &middot; Fast &middot; Transparent
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
              How <span className="text-blaze-orange">ib4me</span> Works
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/80 sm:text-base lg:max-w-2xl lg:text-lg">
              Our platform connects people and communities in need with generous
              donors, creating a community of hope and impact.
            </p>
          </div>

          {/* Wave → white */}
          <div className="absolute -bottom-px left-0 right-0">
            <svg
              viewBox="0 0 1440 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* ── Campaign Creators ── */}
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-10 text-center sm:mb-14 lg:mb-20">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-fun-green sm:text-sm">
                Get started in 3 easy steps
              </p>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
                For <span className="text-fun-green">Campaign Creators</span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                Getting the support you need shouldn&apos;t be complicated.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line — left on mobile, center on desktop */}
              <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-gray-200 sm:left-5 lg:left-1/2 lg:-translate-x-1/2 lg:bg-gradient-to-b lg:from-fun-green lg:via-blaze-orange lg:to-fun-green" />

              <div className="space-y-8 sm:space-y-10 lg:space-y-20">
                {creatorSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isEven = idx % 2 === 0;

                  return (
                    <div
                      key={idx}
                      className={`relative flex flex-col lg:flex-row lg:items-start ${
                        isEven ? "" : "lg:flex-row-reverse"
                      }`}
                    >
                      {/* Number badge — sits on the line */}
                      <div
                        className={`absolute left-4 top-0 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full ${step.color} text-xs font-bold text-white shadow-md ring-4 ring-white sm:left-5 sm:h-10 sm:w-10 sm:text-sm lg:left-1/2 lg:h-12 lg:w-12 lg:text-base`}
                      >
                        {idx + 1}
                      </div>

                      {/* Card */}
                      <div className="ml-10 sm:ml-14 lg:ml-0 lg:w-[calc(50%-2.5rem)]">
                        <div className="rounded-2xl bg-background p-5 shadow-md ring-1 ring-border transition-shadow hover:shadow-lg sm:rounded-3xl sm:p-7 lg:p-8">
                          <div className="mb-4 flex items-center gap-3 sm:gap-4">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.color} sm:h-12 sm:w-12`}
                            >
                              <StepIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-foreground sm:text-lg lg:text-xl">
                                {step.title}
                              </h3>
                              <p className="text-xs text-muted-foreground sm:text-sm">
                                {step.description}
                              </p>
                            </div>
                          </div>

                          <ul className="space-y-2">
                            {step.details.map((detail, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 sm:gap-3"
                              >
                                <CheckCircle
                                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${step.accent}`}
                                />
                                <span className="text-xs text-muted-foreground sm:text-sm lg:text-base">
                                  {detail}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Spacer for the other side — desktop only */}
                      <div className="hidden lg:block lg:w-[calc(50%-2.5rem)]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── For Donors ── */}
        <section className="bg-gray-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center sm:mb-14">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blaze-orange sm:text-sm">
                4 simple steps
              </p>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
                For <span className="text-blaze-orange">Donors</span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                Making a difference is easy when your donation goes directly to
                people who need it.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {donorSteps.map((item, index) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={index}
                    className="group relative rounded-2xl bg-background p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:rounded-3xl sm:p-6"
                  >
                    {/* Faded number */}
                    <span className="absolute right-4 top-3 text-4xl font-black text-muted transition-colors group-hover:text-fun-green/10 sm:text-5xl">
                      {item.number}
                    </span>

                    <div className="relative">
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fun-green/10 text-fun-green sm:h-12 sm:w-12">
                        <ItemIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>

                      <h3 className="mb-1.5 text-base font-bold text-foreground sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Trust & Safety ── */}
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
                Built on <span className="text-fun-green">Trust</span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                We keep the platform open and accessible while ensuring every
                transaction is safe.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              {trustItems.map((item, index) => {
                const TrustIcon = item.icon;
                return (
                  <Card
                    key={index}
                    className="rounded-2xl border-0 p-6 text-center shadow-sm transition-all hover:shadow-md sm:rounded-3xl sm:p-8"
                  >
                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-fun-green/10 text-fun-green sm:h-14 sm:w-14">
                      <TrustIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <h3 className="mb-1.5 text-base font-bold text-foreground sm:text-lg lg:text-xl">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm lg:text-base">
                      {item.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Success Stats ── */}
        <section className="border-b border-border bg-muted/30 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl lg:text-5xl">
                Proven <span className="text-fun-green">Results</span>
              </h2>
              <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
                Real impact for real people and communities.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center rounded-2xl bg-background p-5 text-center shadow-sm ring-1 ring-border sm:p-7 lg:p-8"
                >
                  <StatItem stat={stat} loaded={!!platformData} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA card ── */}
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white px-8 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06),_0_20px_60px_-5px_rgba(0,0,0,0.18)] sm:px-12 sm:py-16">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
              <Heart className="h-8 w-8 text-primary sm:h-10 sm:w-10" aria-hidden="true" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:mb-5 sm:text-3xl lg:text-5xl">
              Ready to Get <span className="text-primary">Started</span>?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-sm text-muted-foreground sm:mb-10 sm:text-base lg:text-lg">
              Whether you need support or want to help others, ib4me makes it
              simple, secure, and transparent.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                size="lg"
                className="group h-12 w-full rounded-full bg-blaze-orange px-8 font-bold text-white transition-all hover:bg-blaze-orange/90 hover:shadow-lg sm:w-auto"
                asChild
              >
                <Link href="/dashboard" className="inline-flex items-center justify-center">
                  Start a Campaign
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-2 border-primary px-8 font-bold text-primary transition-all hover:bg-primary hover:text-white sm:w-auto"
                asChild
              >
                <Link href="/campaigns" className="inline-flex items-center justify-center">
                  Browse Campaigns
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks;
