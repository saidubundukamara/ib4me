"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight, Smartphone, Clock, Globe, Share2, FileText,
  MessageSquare, Wallet, Shield, Headphones, Users, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─── Animation variants ─────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─── Data ───────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Globe,
    title: "Local & International Donations",
    description: "Receive donations via Orange Money, AfriMoney, & Visa/MasterCard.",
    iconClass: "text-blue-600",
    bgClass: "bg-blue-100",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share your fundraiser to Facebook, X and WhatsApp with a single click.",
    iconClass: "text-violet-600",
    bgClass: "bg-violet-100",
  },
  {
    icon: FileText,
    title: "Donation Statements",
    description: "Access all your donation, withdrawal and expense statements in one place.",
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-100",
  },
  {
    icon: MessageSquare,
    title: "SMS Blast (SL only)",
    description: "Reach out to your existing donors with free SMS blasts.",
    iconClass: "text-amber-600",
    bgClass: "bg-amber-100",
  },
  {
    icon: Wallet,
    title: "Easy Withdrawal",
    description: "Withdraw your funds at any time to your mobile wallet.",
    iconClass: "text-green-600",
    bgClass: "bg-green-100",
  },
  {
    icon: Shield,
    title: "Enhanced Security",
    description: "Protect donations through verification with documents and treasurers.",
    iconClass: "text-red-600",
    bgClass: "bg-red-100",
  },
  {
    icon: Headphones,
    title: "Live Customer Support",
    description: "Customer Care 7 days a week via email, phone & social media.",
    iconClass: "text-pink-600",
    bgClass: "bg-pink-100",
  },
  {
    icon: Users,
    title: "Unlimited Donors",
    description: "There is no limit to how many people can donate to your fundraiser.",
    iconClass: "text-indigo-600",
    bgClass: "bg-indigo-100",
  },
];

const steps = [
  {
    number: "01",
    title: "Register",
    description: "Create your fundraiser account and begin raising money for your cause.",
    dialBefore: "Dial ",
    dialAfter: " on your phone and accept the Terms & Conditions.",
    accent: "bg-primary",
  },
  {
    number: "02",
    title: "Share",
    description: "Get the word out to your supporters via Facebook, WhatsApp, X or SMS.",
    dialBefore: "Dial ",
    dialAfter: ' and select "Share My Fundraiser".',
    accent: "bg-blaze-orange",
  },
  {
    number: "03",
    title: "Manage & Withdraw",
    description: "View statements, check your status, manage treasurers, and withdraw funds.",
    dialBefore: "Dial ",
    dialAfter: ' and select "Manage My Fundraiser".',
    accent: "bg-primary",
  },
];

const faqs = [
  {
    q: "When will USSD fundraisers be available?",
    a: "We're actively building this feature. Follow us on social media or check back here — we'll announce the launch date as soon as it's confirmed.",
  },
  {
    q: "What phone do I need?",
    a: "Any basic mobile phone with a Sierra Leone SIM card. No smartphone, no data, no app required — just your keypad.",
  },
  {
    q: "Is it safe?",
    a: "Yes. Transactions are protected by mobile network security. Fundraisers are verified with documents and optional treasury oversight.",
  },
  {
    q: "Can I receive international donations?",
    a: "Absolutely. Even though you manage your fundraiser via USSD, donors worldwide can contribute using Visa, MasterCard, or their own mobile money accounts.",
  },
];

/* ─── USSD code placeholder ──────────────────────────────────────────── */

function UssdCode() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-muted-foreground/40 underline decoration-dashed decoration-muted-foreground/30">
            *XXX#
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Code assigned at launch
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */

export default function MobileFundraisersContent() {
  const prefersReducedMotion = useReducedMotion();

  const anim = (props: {
    variants?: Variants;
    initial?: string;
    animate?: string;
    whileInView?: string;
    viewport?: { once: boolean; margin: string };
  }) => (prefersReducedMotion ? {} : props);

  const shareText = encodeURIComponent(
    "USSD fundraising is coming to Sierra Leone! Raise money for any cause directly from your mobile — no internet needed. Check it out: https://ib4me.org/mobile-fundraisers"
  );
  const waShareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="min-h-dvh bg-background font-Sora">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-fun-green py-16 sm:py-24 lg:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blaze-orange/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-chartereuse/10 blur-3xl" />
        </div>

        <div className="relative container max-w-screen-xl px-5 mx-auto">
          <motion.div
            className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto"
            {...anim({ variants: stagger, initial: "hidden", animate: "visible" })}
          >
            <motion.div
              variants={fadeUp}
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 ring-4 ring-white/30 shadow-lg"
            >
              <Smartphone className="h-10 w-10 text-white" />
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            >
              <Clock className="h-3.5 w-3.5" />
              Coming Soon
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight"
            >
              Mobile (USSD) Fundraisers
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl"
            >
              Perfect for individuals without regular internet access in{" "}
              <strong className="text-white font-bold">Sierra Leone</strong>.
              Raise funds fast via USSD — no smartphone or data required.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button
                asChild
                size="lg"
                className="rounded-2xl px-8 h-14 text-base font-semibold bg-blaze-orange hover:bg-blaze-orange/90 text-white shadow-lg border-0"
              >
                <Link href="/dashboard/campaigns/new">
                  Start an Online Campaign
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl px-8 h-14 text-base font-semibold border-2 border-white/40 bg-transparent text-white hover:bg-white/10 hover:border-white/60"
              >
                <Link href="/campaigns">Browse Campaigns</Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-white/80 mt-2"
            >
              {["No internet needed", "Sierra Leone only", "Setup in minutes"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chartereuse" />
                  <span>{t}</span>
                </div>
              ))}
            </motion.div>

          </motion.div>
        </div>

        {/* Bottom wave */}
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
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* ── What is it ── */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container max-w-screen-xl px-5 mx-auto">
          <motion.div
            className="grid gap-10 lg:grid-cols-2 items-center max-w-5xl mx-auto"
            {...anim({ variants: stagger, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } })}
          >
            <motion.div variants={fadeUp} className="space-y-5">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                What is this?
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Fundraising without internet
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Mobile (USSD) fundraisers are built for{" "}
                <strong className="text-foreground">quick, fast fundraising</strong> — like a
                family fundraiser for school fees — without needing images, video,
                or a story page.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                All you need is a basic mobile phone and a Sierra Leone number.
                Everything runs over USSD — no internet, no app, no problem.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-3xl bg-fun-green/5 border border-primary/15 p-8 space-y-4"
            >
              {[
                "No internet connection needed",
                "Works on any basic mobile phone",
                "Sierra Leone numbers only",
                "Fast setup — under 5 minutes",
                "Secure & verified transactions",
              ].map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 text-sm font-medium text-foreground"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L4.5 8.5L10 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {point}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 3 Steps ── */}
      <section className="py-16 sm:py-20 bg-muted/40">
        <div className="container max-w-screen-xl px-5 mx-auto">
          <motion.div
            className="text-center mb-12"
            {...anim({ variants: fadeUp, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } })}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
              How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              3 Simple Steps to Get Started
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Everything you need, right from your phone keypad.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto"
            {...anim({ variants: stagger, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-60px" } })}
          >
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-3xl bg-card border border-border p-8 shadow-sm hover:-translate-y-1 transition-transform flex flex-col gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.accent} text-white shadow-md`}>
                    <span className="text-xl font-bold">{step.number}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-base font-bold text-foreground leading-tight">{step.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                <div className="mt-auto rounded-xl bg-muted/80 border border-border/50 px-4 py-3 text-xs text-muted-foreground font-mono leading-relaxed">
                  {step.dialBefore}
                  <UssdCode />
                  {step.dialAfter}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container max-w-screen-xl px-5 mx-auto">
          <motion.div
            className="text-center mb-12"
            {...anim({ variants: fadeUp, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } })}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
              Features
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Everything you need to fundraise
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Built specifically for Sierra Leone — powerful tools accessible from any phone.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            {...anim({ variants: stagger, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-60px" } })}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group rounded-3xl border border-border bg-card p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.bgClass}`}>
                  <f.icon className={`h-6 w-6 ${f.iconClass}`} />
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1 text-sm leading-snug">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container max-w-screen-xl px-5 mx-auto">
          <motion.div
            className="max-w-2xl mx-auto"
            {...anim({ variants: stagger, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } })}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
                FAQ
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Common questions
              </h2>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="rounded-2xl border border-border bg-card px-6 shadow-sm data-[state=open]:border-primary/20"
                  >
                    <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-16 sm:py-20 bg-muted/10">
        <motion.div
          className="mx-auto max-w-3xl rounded-3xl bg-fun-green text-white px-8 py-12 sm:px-12 sm:py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.2),_0_24px_64px_-8px_rgba(0,0,0,0.4)]"
          {...anim({ variants: fadeUp, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } })}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mx-auto mb-6">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Can&apos;t wait? Start online today.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8 max-w-lg mx-auto">
            While we&apos;re building Mobile USSD fundraisers, you can reach donors
            worldwide with an online campaign — right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-2xl px-8 h-14 text-base font-semibold bg-blaze-orange text-white hover:bg-blaze-orange/90 shadow-lg"
            >
              <Link href="/dashboard/campaigns/new">
                Start an Online Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="rounded-2xl px-8 h-14 text-base font-semibold text-white/80 hover:text-white hover:bg-white/10"
            >
              <Link href="/campaigns">Browse Campaigns</Link>
            </Button>
          </div>

          {/* WhatsApp share */}
          <div className="mt-8 pt-8 border-t border-white/15">
            <p className="text-sm text-white/60 mb-4">Help spread the word</p>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2 px-5"
            >
              <a href={waShareUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
