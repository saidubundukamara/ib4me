import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, DollarSign, Search, UserPlus } from "lucide-react";
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
   How ib4me Works
   ───────────────────────────────────────────────────────── */
function GetStartedSection() {
  const steps = [
    {
      icon: Search,
      title: "Find a Campaign",
      description:
        "Browse campaigns and find a cause that resonates with you.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: UserPlus,
      title: "Create Your Profile",
      description:
        "Sign up and create your donor profile to start making a difference.",
      color: "text-blaze-orange",
      bgColor: "bg-blaze-orange/10",
    },
    {
      icon: DollarSign,
      title: "Make a Donation",
      description:
        "Choose your amount and securely contribute to a cause that matters.",
      color: "text-orange-blaze",
      bgColor: "bg-orange-blaze/10",
    },
    {
      icon: Heart,
      title: "Track Your Impact",
      description:
        "Follow the campaigns you support and see the real-world impact of your generosity.",
      color: "text-chartereuse-dark",
      bgColor: "bg-chartereuse/10",
    },
  ];

  return (
    <section className="bg-background py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 space-y-3 text-center sm:mb-14 sm:space-y-4">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            How <span className="text-blaze-orange">ib4me</span> Works
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Making a difference is simple. Follow these easy steps to start
            changing lives today.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="group relative">
                {/* Connecting Line (lg+) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[60%] top-16 hidden h-0.5 w-full bg-gradient-to-r from-border to-transparent lg:block" />
                )}

                {/* Step Card */}
                <div className="relative h-full rounded-3xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] sm:p-8">
                  {/* Step Number */}
                  <div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-lg sm:-right-4 sm:-top-4 sm:h-12 sm:w-12 sm:text-lg">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`${step.bgColor} ${step.color} mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20`}
                  >
                    <Icon
                      className="h-8 w-8 sm:h-10 sm:w-10"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Content */}
                  <h3 className="mb-2.5 text-lg font-bold text-foreground sm:mb-3 sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
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
