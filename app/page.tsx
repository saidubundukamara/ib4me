import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Banknote } from "lucide-react";
import Logo from "@/public/assets/ib4melogowhite.png";
import StatsSection from "./_components/StatsSection";
import CategoriesSection from "./_components/CategoriesSection";
import DiscoverCampaigns from "./_components/DiscoverCampaigns";
import TestimonialsSection from "./_components/TestimonialsSection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <DiscoverCampaigns />
      <CategoriesSection />
      <StatsSection />
      <GetStartedSection />
      <WhyIb4meSection />
      <TestimonialsSection />
      <FundraiseSection />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-fun-green py-12 sm:py-16 md:py-24 lg:py-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blaze-orange/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-chartereuse/10 blur-3xl sm:h-64 sm:w-64" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-primary sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Trusted by thousands of donors worldwide</span>
          </div>

          {/* Logo */}
          <div className="animate-fade-up delay-100 mb-5 flex justify-center sm:mb-6">
            <Image
              src={Logo}
              alt="ib4me - Put Fo Wɛlbɔdi"
              className="h-18 w-auto sm:h-24 md:h-28 lg:h-32"
              priority
            />
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-up delay-200 mb-4 text-balance font-Sora text-3xl font-bold leading-tight tracking-tight text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="text-blaze-orange">Helping</span> Each Other Can
            Make The World A{" "}
            <span className="text-blaze-orange">Better</span> Place
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up delay-300 mx-auto mb-8 max-w-2xl text-pretty font-Sora text-base leading-relaxed text-white/80 sm:mb-10 sm:text-lg md:text-xl">
            Support life-changing campaigns for education, community development,
            health, and more. Make a real difference in someone&apos;s life today.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up delay-400 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="group h-11 rounded-2xl bg-blaze-orange px-6 text-sm font-semibold text-white transition-all hover:bg-blaze-orange/90 hover:shadow-lg sm:h-12 sm:px-8 sm:text-base"
              asChild
            >
              <Link href="/campaigns">
                Explore Campaigns
                <ArrowRight
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-2xl border-2 border-white bg-transparent px-6 text-sm font-semibold text-white transition-all hover:bg-primary hover:text-white sm:h-12 sm:px-8 sm:text-base"
              asChild
            >
              <Link href="/dashboard">Start a Campaign</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-white/90 sm:mt-12 sm:gap-6 sm:text-sm md:gap-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-chartereuse" />
              <span>Secure &amp; Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-chartereuse" />
              <span>100% Transparent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-chartereuse" />
              <span>Fast Withdrawals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave divider */}
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
  );
}

/* ─────────────────────────────────────────────────────────
   How ib4me Works — horizontal timeline, no icon circles
   ───────────────────────────────────────────────────────── */
function GetStartedSection() {
  const steps = [
    {
      number: "01",
      title: "Find a Campaign",
      description:
        "Browse causes in education, health, and community. Filter by urgency or category to find what resonates.",
    },
    {
      number: "02",
      title: "Create Your Profile",
      description:
        "Sign up in under a minute. Your profile lets you track donations and receive campaign impact updates.",
    },
    {
      number: "03",
      title: "Donate Securely",
      description:
        "Pay with Orange Money, AfriMoney, or card. Every fee is itemised before you confirm — no surprises.",
    },
    {
      number: "04",
      title: "See Your Impact",
      description:
        "Get automated updates from the campaigns you support. See exactly where your contribution goes.",
    },
  ];

  return (
    <section className="bg-background py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 space-y-3 text-center sm:mb-16">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
            How <span className="text-blaze-orange">ib4me</span> Works
          </h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            Four steps. Start to finish in under two minutes.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-0">
          {/* Connecting line — desktop only */}
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-border md:block"
          />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center md:px-6"
            >
              {/* Step number dot on the line */}
              <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background ring-2 ring-border">
                <span className="text-xl font-bold text-blaze-orange">
                  {step.number}
                </span>
              </div>

              <h3 className="mb-2 text-base font-bold text-foreground sm:text-lg">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Why ib4me? — dark green section, 3 bold claims, no icon grid
   ───────────────────────────────────────────────────────── */
function WhyIb4meSection() {
  const claims = [
    {
      heading: "Mobile money, first-class.",
      body: "Orange Money and AfriMoney are primary payment methods — not an afterthought. No bank account required to donate or withdraw.",
    },
    {
      heading: "Every fee shown before you give.",
      body: "We itemise the platform fee, payment processing, and net amount before you confirm. Zero hidden charges, ever.",
    },
    {
      heading: "Automated reports for every campaign.",
      body: "Organizers and donors both receive progress updates automatically. No chasing for numbers.",
    },
  ];

  return (
    <section className="bg-fun-green py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 space-y-3 sm:mb-14">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Why <span className="text-blaze-orange">ib4me</span>?
          </h2>
          <p className="max-w-xl text-base text-white/70">
            Built specifically for Sierra Leone. Three things that set us apart.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {claims.map((claim, i) => (
            <div key={i} className="border-t border-white/20 pt-8">
              <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">
                {claim.heading}
              </h3>
              <p className="text-base leading-relaxed text-white/70">
                {claim.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   CTA / Fundraise
   ───────────────────────────────────────────────────────── */
function FundraiseSection() {
  return (
    <section className="px-4 py-16 font-Sora sm:px-6 sm:py-20 lg:px-8">
      <div className="animate-fade-up mx-auto max-w-3xl rounded-3xl border border-border bg-background px-5 py-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06),_0_20px_60px_-5px_rgba(0,0,0,0.22)] sm:px-10 sm:py-12 md:px-12 md:py-16">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
          <Heart className="h-8 w-8 text-primary sm:h-10 sm:w-10" aria-hidden="true" />
        </div>
        <h2 className="mb-4 text-3xl font-bold text-foreground sm:mb-5 sm:text-4xl md:text-5xl">
          Ready to Make a{" "}
          <span className="text-primary">Difference</span>?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground sm:mb-10 sm:text-lg">
          Join thousands of compassionate donors helping people and communities
          in need. Your contribution changes lives.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            className="group h-11 rounded-2xl bg-blaze-orange px-6 text-sm font-semibold text-white transition-all hover:bg-blaze-orange/90 hover:shadow-lg sm:h-12 sm:px-8 sm:text-base"
            asChild
          >
            <Link href="/campaigns">
              Start Donating Today
              <ArrowRight
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
                aria-hidden="true"
              />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 rounded-2xl border-2 border-primary px-6 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-white sm:h-12 sm:px-8 sm:text-base"
            asChild
          >
            <Link href="/dashboard">Start Your Campaign</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

