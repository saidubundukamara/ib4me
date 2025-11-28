"use client";


import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { ArrowRight, Heart, DollarSign, Search, UserPlus, ArrowLeft, Megaphone, Target, Quote, CloudLightning, ChevronDown, } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MdOutlineHealthAndSafety, MdOutlineDeviceThermostat } from "react-icons/md";
import { FaResearchgate } from "react-icons/fa";
import { RiMentalHealthLine, RiUserCommunityFill } from "react-icons/ri";
import { TfiSupport } from "react-icons/tfi";
import Logo from "@/public/assets/ib4melogowhite.png";
import CampaignCard from "./_components/CampaignCard";
import { stats } from "./_components/stats";
import { toast } from "sonner";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <DiscoverCampaigns />
      <Testimonials />
      <GetStartedSection />
      <FundraiseSection />
      <CategoriesSection />

    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-fun-green py-12 sm:py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="mx-auto max-w-4xl text-center transition-all duration-50 "
        >
          {/* Badge */}
          <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Trusted by thousands of donors worldwide</span>
          </div>

          {/* Logo */}
          <div className="mb-5 sm:mb-6 flex justify-center animate-scale-in">
            <Image
              src={Logo}
              alt="ib4me - Put Fo Wɛlbɔdi"
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto"
              priority
            />
          </div>

          {/* Main Heading */}
          <h1 className="mb-4 sm:mb-6 text-balance font-Sora font-bold leading-tight tracking-tight text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="text-blaze-orange">Helping</span> Each Other Can Make The World A{" "}
            <span className="text-blaze-orange">Better</span> Place
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 sm:mb-10 max-w-2xl text-pretty font-Sora text-white/80 text-base sm:text-lg md:text-xl leading-relaxed">
            Support life-changing medical campaigns, connect with healthcare providers, and make a real difference in
            someone&#39;s journey to recovery.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="group h-11 sm:h-12 rounded-2xl bg-blaze-orange px-6 sm:px-8 text-sm sm:text-base font-semibold text-white transition-all hover:bg-blaze-orange/90 hover:shadow-lg"
              asChild
            >
              <Link href="/campaigns">
                Explore Campaigns
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-11 sm:h-12 rounded-2xl border-2 border-white bg-transparent px-6 sm:px-8 text-sm sm:text-base font-semibold text-white transition-all hover:bg-primary hover:text-white"
              asChild
            >
              <Link href="/dashboard">Start a Campaign</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-white/90">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-chartereuse" />
              <span>Secure & Verified</span>
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
    </section>
  );
}

function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="border-y border-border bg-muted/20 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-2xl text-center space-y-4 sm:space-y-6">
          <h2 className="font-Sora font-semibold text-3xl sm:text-4xl lg:text-5xl">
            ib4me in <span className="text-fun-green">numbers</span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
            Join thousands of people who have successfully funded their medical treatments and helped others in need.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-6 sm:gap-8 font-Sora">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`flex h-full flex-col items-center text-center transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  } motion-reduce:transform-none motion-reduce:opacity-100`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className="mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: stat.color }} aria-hidden="true" />
                </div>

                <div className="mb-1.5 sm:mb-2 text-3xl sm:text-4xl font-bold" style={{ color: stat.color }}>
                  <CountUp
                    start={0}
                    end={parseFloat(stat.value.replace(/[^\d.-]/g, ""))}
                    duration={5}
                    separator=","
                  />
                  {stat.value.includes("%") ? "%" : "+"}
                </div>

                <div className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function DiscoverCampaigns() {
function formatAmount(amount: number, currency = "SLE") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    }).format(amount);
  }

  type Item = {
    id: string;
  slug: string;
  title: string;
  currency: string;
  description?: string;
  amountRaised: number;
    goalAmount: number;
    donationsCount: number;
    imageUrl: string;
  };

  const [items, setItems] = useState<Item[]>([]);
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/campaigns/active?limit=6")
      .then((r) => r.json())
      .then((data: Item[]) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setItems((items) => items.slice(0, 6));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = (campaign: Item) => {
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}/campaigns/${campaign.slug}`;
    const shareData = {
      title: campaign.title,
      text: campaign.description || "Support this campaign on ib4me",
      url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        /* share dismissed */
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("Campaign link copied"))
        .catch(() => toast.error("Unable to copy link"));
    } else {
      toast.info("Share not supported on this device");
    }
  };



  return (
    <main className="container max-w-screen-xl mx-auto py-16 px-4 font-Sora">
      <div className="text-center mb-16 space-y-4 animate-fade-in">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
          Featured <span className="text-blaze-orange">Campaigns</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every campaign represents a real person in need. Your generosity can change lives.
        </p>
      </div>
      <div className="flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center gap-4 py-5">
        <h1 className="text-2xl font-bold  m-0">
          Discover Campaigns inspired by what you care about
        </h1>
        <Link href="/campaigns">
          <Button>View All Campaigns</Button>
        </Link>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Help save Lives
                <ChevronDown className="-me-1 opacity-60" size={16} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuItem className="cursor-pointer">
                <div
                  className="bg-background flex size-8 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <Megaphone size={16} className="opacity-60 text-blaze-orange" />
                </div>
                <div>
                  <div className="text-sm font-medium">Just Started</div>
                  <div className="text-muted-foreground text-xs">Fundraisers started in the last two days</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <div
                  className="bg-background flex size-8 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <Target size={16} className="opacity-60 text-blaze-orange" />
                </div>
                <div>
                  <div className="text-sm font-medium">Close to goal</div>
                  <div className="text-muted-foreground text-xs">Fundraisers within 5% of their goal</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <div
                  className="bg-background flex size-8 items-center justify-center rounded-md border"
                  aria-hidden="true"
                >
                  <CloudLightning size={16} className="opacity-60 text-blaze-orange" />
                </div>
                <div>
                  <div className="text-sm font-medium">Needs Momentum</div>
                  <div className="text-muted-foreground text-xs">Fundraisers that need a push</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => api?.scrollPrev()}
            className="p-2 cursor-pointer rounded-full border text-blaze-orange"
            aria-label="Previous"
          >
            <ArrowLeft />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="p-2 cursor-pointer rounded-full border text-blaze-orange"
            aria-label="Next"
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      <Carousel setApi={setApi} opts={{ align: "start" }}>
        <CarouselContent>
          {items.map((c) => (
            <CarouselItem key={c.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <CampaignCard
                  title={c.title}
                  description={`${formatAmount(c.amountRaised, c.currency)} raised of ${formatAmount(
                    c.goalAmount,
                    c.currency
                  )}`}
                  imageUrl={c.imageUrl}
                  raised={c.amountRaised}
                  goal={c.goalAmount}
                  donors={c.donationsCount}
                  verified={false}
                  urgent={false}
                  href={`/campaigns/${c.slug}`}
                  currency={c.currency || "SLE"}
                  onShare={() => handleShare(c)}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </main>
  );
}



function GetStartedSection() {
  const steps = [
    {
      icon: Search,
      title: "Find a Campaign",
      description: "Browse verified medical campaigns and find one that resonates with you.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: UserPlus,
      title: "Create Your Profile",
      description: "Sign up and create your donor profile to start making a difference.",
      color: "text-blaze-orange",
      bgColor: "bg-blaze-orange/10",
    },
    {
      icon: DollarSign,
      title: "Make a Donation",
      description: "Choose your amount and securely contribute to life-changing medical care.",
      color: "text-orange-blaze",
      bgColor: "bg-orange-blaze/10",
    },
    {
      icon: Heart,
      title: "Track Your Impact",
      description: "Follow the campaigns you support and see the real-world impact of your generosity.",
      color: "text-chartereuse",
      bgColor: "bg-chartereuse/10",
    },
  ];

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 space-y-3 sm:space-y-4 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            How <span className="text-blaze-orange">ib4me</span> Works
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            Making a difference is simple. Follow these easy steps to start changing lives today.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`relative group animate-slide-up motion-reduce:animate-none`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Connecting Line (lg+) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}

                {/* Step Card */}
                <div className="relative h-full rounded-3xl border border-border bg-card p-6 sm:p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`${step.bgColor} ${step.color} mx-auto mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2.5 sm:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
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

function CategoriesSection() {
  const category = [
    { id: 1, name: "Treatments & Procedures", icon: MdOutlineHealthAndSafety, href: "/discover/medical" },
    { id: 2, name: "Research & Innovation", icon: FaResearchgate, href: "/discover/education" },
    { id: 3, name: "Mental Health & Therapy", icon: RiMentalHealthLine, href: "/discover/emergency" },
    { id: 4, name: "Equipment & Devices", icon: MdOutlineDeviceThermostat, href: "/discover/memorial" },
    { id: 5, name: "Patient & Caregiver Support", icon: TfiSupport, href: "/discover/community" },
    { id: 6, name: "Community Health Initiatives", icon: RiUserCommunityFill, href: "/discover/nonprofit" },
  ];

  return (
    <section className="font-Sora py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-Lora text-center text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12">
          Find a <span className="text-fun-green">fundraiser</span> by category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 auto-rows-fr gap-4 sm:gap-6">
          {category.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex h-full w-full flex-col items-center rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="p-3 sm:p-4 rounded-full mb-3">
                <cat.icon
                  className="h-8 w-8 sm:h-10 sm:w-10 text-primary transition-colors group-hover:text-blaze-orange"
                  aria-hidden="true"
                />
              </div>
              <span className="text-sm sm:text-base font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


function FundraiseSection() {
  return (
    <section className="relative overflow-hidden bg-fun-green py-12 sm:py-16 md:py-24 lg:py-28 text-white font-Sora">
      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-0 h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96 rounded-full bg-fun-green/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96 rounded-full bg-blaze-orange/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/20">
          <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-blaze-orange" aria-hidden="true" />
        </div>
        <h2 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl font-bold">
          Ready to Make a <span className="text-orange-blaze">Difference</span>?
        </h2>
        <p className="mx-auto mb-8 sm:mb-10 max-w-2xl text-base sm:text-lg md:text-xl text-white/90">
          Join thousands of compassionate donors helping patients access the medical care they need. Your contribution saves lives.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            className="group h-11 sm:h-12 rounded-2xl bg-blaze-orange px-6 sm:px-8 text-sm sm:text-base font-semibold text-white transition-all hover:bg-blaze-orange/90 hover:shadow-lg"
            asChild
          >
            <Link href="/campaigns">
              Start Donating Today
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 sm:h-12 rounded-2xl border-2 border-white bg-transparent px-6 sm:px-8 text-sm sm:text-base font-semibold text-white transition-all hover:bg-fun-green/80 hover:text-white"
            asChild
          >
            <Link href="/dashboard">Start Your Campaign</Link>
          </Button>
        </div>
      </div>
    </section>

  )
}


const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Heart Surgery Patient",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      quote: "Thanks to this platform, I received the heart surgery I desperately needed. The support from donors has given me a second chance at life."
    },
    {
      name: "Michael Chen",
      role: "Cancer Survivor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      quote: "The community here is incredible. Not only did they help fund my treatment, but their encouragement kept me fighting through the hardest days."
    },
    {
      name: "Emma Rodriguez",
      role: "Grateful Mother",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      quote: "My daughter can see clearly now thanks to everyone who donated. This platform connected us with people who truly care. Forever grateful."
    }
  ];

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-10 sm:mb-14 space-y-3 sm:space-y-4 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Stories of <span className="text-fun-green">Hope</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground">
            Hear from the people whose lives have been transformed by your generosity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 auto-rows-fr gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="flex h-full flex-col rounded-3xl border-0 p-6 sm:p-8 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-lift)] animate-scale-in motion-reduce:animate-none"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="h-8 w-8 sm:h-10 sm:w-10 text-blaze-orange mb-3 sm:mb-4" aria-hidden="true" />
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 sm:mb-6">
                &quot;{testimonial.quote}&quot;
              </p>

              <div className="mt-auto flex items-center gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm sm:text-base font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
