"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { ChevronRight, User, Users, HeartHandshake } from "lucide-react";
import { MdOutlineHealthAndSafety, MdOutlineDeviceThermostat } from "react-icons/md";
import { FaResearchgate } from "react-icons/fa";
import { RiMentalHealthLine, RiUserCommunityFill } from "react-icons/ri";
import { TfiSupport } from "react-icons/tfi";

type Campaign = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  donationsCount: number;
  amountRaised: number;
  currency: string;
  goalAmount: number;
};

const campaigns: Campaign[] = [
  {
    id: "1",
    title: "Recovery from my stroke",
    slug: "recovery-from-my-stroke",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 1300,
    amountRaised: 62843,
    currency: "GBP",
    goalAmount: 74050,
  },
  {
    id: "2",
    title: "Des's fight against cancer",
    slug: "des-fight-against-cancer",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 1600,
    amountRaised: 42643,
    currency: "GBP",
    goalAmount: 60919,
  },
  {
    id: "3",
    title: "Churchtown Playground",
    slug: "churchtown-playground",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 9400,
    amountRaised: 271678,
    currency: "GBP",
    goalAmount: 286029,
  },
  {
    id: "4",
    title: "Help Peter David",
    slug: "help-peter-david",
    imageUrl: "/assets/wan.jpg",
    donationsCount: 500,
    amountRaised: 15000,
    currency: "GBP",
    goalAmount: 25000,
  },
];

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDonationsCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K donations`;
  return `${count} donations`;
}

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <GetStartedSection />
      <DiscoverCampaigns />
      <CategoriesSection />
      <InfoSection />
      <HowIb4meWorks />
      <CoveredCard />
      <StoriesSection />
      <FundraiseSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section>
      <div className="container mx-auto max-w-screen-xl px-4 py-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="my-6 text-pretty text-3xl font-bold lg:text-5xl xl:text-6xl">
            {" Let's come together as a community and Ib4me"}
          </h1>
          <p className="text-gray-600 mb-8 max-w-xl sm:text-xl text-lg">
            Connect with a community that cares. Raise funds for medical treatments, support
            healthcare needs, and help others in their journey to wellness.
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
            <Link href="/create-campaign" className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-white">
              Start a Campaign
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/campaigns" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-50">
              Ib4me Now
            </Link>
          </div>
        </div>
        <div className="flex">
          <img
            src="/assets/Hero.png"
            alt="hero"
            className="max-h-[600px] w-full rounded-md object-cover lg:max-h-[800px]"
          />
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = useMemo(
    () => [
      { value: "1,200", label: "campaigns funded" },
      { value: "56%", label: "Raised" },
      { value: "500", label: "Fundraisers" },
    ],
    []
  );

  return (
    <section className="py-8 md:py-14">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
          <h2 className="text-4xl font-semibold lg:text-5xl">Ib4me in numbers</h2>
          <p className="text-gray-600">
            Join thousands of people who have successfully funded their medical treatments and helped others in need.
          </p>
        </div>
        <div className="grid gap-0.5 *:text-center md:grid-cols-3">
          {stats.map((stat, i) => (
            <div key={i} className="rounded space-y-4 border py-12">
              <div className="text-2xl sm:text-4xl font-bold">
                <CountUp start={0} end={parseFloat(stat.value.replace(/[^\d.-]/g, ""))} duration={5} separator="," />
                {stat.value.includes("%") ? "%" : "+"}
              </div>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetStartedSection() {
  const features = [
    { step: "Step 1", content: "Use our tool to create your fundraising Campaign.", image: "/assets/Create-fundraiser.jpg" },
    { step: "Step 2", content: "Reach Donors by sharing.", image: "/assets/recieve-donations.png" },
    { step: "Step 3", content: "Securely recieve funds.", image: "/assets/share-fundraiser.png" },
  ];
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 3.33;
        if (next >= 100) {
          setCurrentFeature((p) => (p + 1) % features.length);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-10 p-8 md:p-12 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-10 md:mb-12 text-center text-neutral-900">
          Fundraising on Ib4me is easy, powerful, and trusted.
        </h2>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10">
          <div className="order-2 md:order-1 space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-6 md:gap-8"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${index === currentFeature ? "bg-green-400 scale-110" : "bg-gray-500"} border-2 ${index === currentFeature ? "border-green-400" : "border-gray-400"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {index <= currentFeature ? (
                    <span className="text-white text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-white text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold text-neutral-900">{feature.step}</h3>
                  <p className="text-sm md:text-lg text-neutral-800">{feature.content}</p>
                </div>
              </motion.div>
            ))}
            <div className="h-2 w-full overflow-hidden rounded bg-neutral-200">
              <div className="h-2 bg-green-400" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="order-1 md:order-2 relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-lg shadow-lg">
            <AnimatePresence mode="wait">
              {features.map((feature, index) =>
                index === currentFeature ? (
                  <motion.div
                    key={index}
                    className="absolute inset-0 rounded-lg overflow-hidden"
                    initial={{ y: 100, opacity: 0, rotateX: -20 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -100, opacity: 0, rotateX: 20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <img src={feature.image} alt={feature.step} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-4" />
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoverCampaigns() {
  return (
    <main className="container max-w-screen-xl mx-auto py-16 px-4">
      <div className="flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center gap-4 py-5">
        <h1 className="text-2xl font-bold m-0">Discover Campaigns inspired by what you care about</h1>
        <Link href="/campaigns" className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">View All Campaigns</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => {
          const progress = Math.min(100, Math.round((c.amountRaised / c.goalAmount) * 100));
          return (
            <Link key={c.id} href={`/campaigns/${c.slug}`} className="block" aria-label={`View details for ${c.title}`}>
              <article className="overflow-hidden rounded-lg border bg-white group">
                <div className="relative">
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img src={c.imageUrl} alt={c.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm font-medium px-3 py-1 rounded-full">
                    {formatDonationsCount(c.donationsCount)}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-sm sm:text-lg line-clamp-2 mb-2">{c.title}</h4>
                  <div className="flex flex-col gap-2">
                    <div className="h-2 w-full overflow-hidden rounded bg-neutral-200">
                      <div className="h-2 bg-green-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="font-bold text-sm sm:text-lg">{formatAmount(c.amountRaised, c.currency)} raised</p>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function CategoriesSection() {
  const categories = [
    { id: 1, name: "Treatments & Procedures", icon: MdOutlineHealthAndSafety, href: "/discover/medical" },
    { id: 2, name: "Research & Innovation", icon: FaResearchgate, href: "/discover/education" },
    { id: 3, name: "Mental Health & Therapy", icon: RiMentalHealthLine, href: "/discover/emergency" },
    { id: 4, name: "Equipment & Devices", icon: MdOutlineDeviceThermostat, href: "/discover/memorial" },
    { id: 5, name: "Patient & Caregiver Support", icon: TfiSupport, href: "/discover/community" },
    { id: 6, name: "Community Health Initiatives", icon: RiUserCommunityFill, href: "/discover/nonprofit" },
  ];

  return (
    <section className="py-14 sm:py-20">
      <div className="container max-w-5xl mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Find a fundraiser by category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={category.href} className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 rounded-full mb-3">
                <category.icon className="h-10 w-10 text-green-300" />
              </div>
              <span className="font-medium text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoSection() {
  return (
    <section className="py-16 md:py-32 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <h2 className="text-3xl sm:text-4xl font-medium">Fundraising on Ib4me is easy, powerful, and trusted.</h2>
          <div className="space-y-6">
            <p>
              Get what you need to help your fundraiser succeed on Ib4me, whether you're raising money for yourself, friends, family, or charity. With no fee to start, Ib4me is the Sierra Leones's leading crowdfunding platform for medical emergencies. Whenever you need help, you can ask here.
            </p>
            <p>Still have questions? Learn more about how Ib4me works.</p>
            <Link href="#" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
              <span>Learn More</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowIb4meWorks() {
  const [isVideoPoppedUp, setVideoPopUp] = useState(false);
  return (
    <section>
      <div className="flex justify-center items-center text-neutral-800">
        <div className="max-w-screen-2xl mx-auto px-4 py-12 md:py-20 md:px-8">
          <div className="mx-auto py-10 space-y-6 md:space-y-12">
            <h2 className="text-balance text-3xl font-semibold lg:text-4xl">How Ib4me Works</h2>
          </div>
          <div className="relative">
            <img src="/assets/How_ib4me_works.png" width={800} height={600} className="mx-auto max-w-5xl rounded-lg" alt="How Ib4me works" />
            <button className="absolute w-16 h-16 rounded-full inset-0 m-auto duration-150 bg-green-500 cursor-pointer hover:bg-green-600 text-white" onClick={() => setVideoPopUp(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 m-auto"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
            </button>
          </div>
        </div>
      </div>
      {isVideoPoppedUp ? (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50">
          <div className="absolute inset-0 w-full h-full bg-black/50" onClick={() => setVideoPopUp(false)} />
          <div className="px-4 relative">
            <button className="w-12 h-12 mb-5 rounded-full duration-150 bg-green-500 hover:bg-green-600 text-white" onClick={() => setVideoPopUp(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 m-auto"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
            </button>
            <video className="rounded-lg w-full max-w-5xl" controls autoPlay>
              <source src="https://raw.githubusercontent.com/sidiDev/remote-assets/main/FloatUI.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CoveredCard() {
  return (
    <section className="py-16 md:py-32 bg-white">
      <div className="mx-auto max-w-7xl space-y-5 px-6">
        <h2 className="max-w-xl text-4xl text-neutral-900 font-medium lg:text-5xl">We've got you covered.</h2>
        <div className="space-y-4">
          <p className="text-xl text-neutral-700">
            Ib4me is a trusted leader in online fundraising. With <Link href="#" className="text-gray-900 underline hover:text-gray-700">simple pricing</Link> and a team of <Link href="#" className="text-gray-900 underline hover:text-gray-700">Trust & Safety</Link> experts in your corner, you can raise money or make a donation with peace of mind.
          </p>
          <div className="flex items-center gap-2">
            <svg className="size-4 text-neutral-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p className="text-neutral-600 text-xs sm:text-sm">
              <Link href="#" className="text-gray-900 hover:text-gray-700">Read the Ib4me Giving Guarantee</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  const videos = [
    { id: 1, title: "Cosmic Journey", description: "A masked traveler ventures through the cosmos in search of an elusive truth." },
    { id: 2, title: "Ocean Depths", description: "A girl waits on a secluded shore, anticipating the arrival of the masked traveler." },
    { id: 3, title: "Nature Whisper", description: "The traveler, immersed in nature, experiences profound emotions and goosebumps." },
  ];
  return (
    <section className="bg-white py-8 md:py-16">
      <div className="my-2 mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold lg:text-4xl">Stories that will Inspire you</h2>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <article key={v.id} className="rounded-lg border p-4">
              <div className="h-40 w-full rounded-md bg-neutral-200 flex items-center justify-center">Video</div>
              <h3 className="mt-3 font-semibold">{v.title}</h3>
              <p className="text-sm text-gray-600">{v.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FundraiseSection() {
  const items = [
    { title: "Yourself", description: "Funds are delivered to your bank account for your own use", icon: User },
    { title: "Friends and family", description: "You'll invite a beneficiary to receive funds or distribute them yourself.", icon: Users },
    { title: "Charity", description: "Funds are delivered to your chosen nonprofit for you.", icon: HeartHandshake },
  ];
  return (
    <section className="py-8 md:py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold lg:text-4xl">Raise funds for anyone</h2>
        </div>
        <div className="mx-auto mt-8 grid max-w-sm divide-y overflow-hidden rounded-md border shadow-sm md:mt-16 md:max-w-full md:grid-cols-3 md:divide-x md:divide-y-0">
          {items.map((it) => (
            <Link key={it.title} href="/campaigns" className="group block">
              <div className="p-6">
                <div className="mx-auto flex size-12 items-center justify-center border-l border-t">
                  <it.icon className="size-6" aria-hidden />
                </div>
                <h3 className="mt-6 font-semibold">{it.title}</h3>
                <p className="text-sm mt-2">{it.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
