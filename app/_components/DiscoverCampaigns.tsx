"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  ArrowLeft,
  Megaphone,
  Target,
  CloudLightning,
  ChevronDown,
  FolderSearch,
} from "lucide-react";
import CampaignCard from "./CampaignCard";
import { toast } from "sonner";

type CampaignItem = {
  id: string;
  slug: string;
  title: string;
  currency: string;
  description?: string;
  amountRaised: number;
  goalAmount: number;
  donationsCount: number;
  imageUrl: string;
  urgency?: "low" | "medium" | "high";
  ownerVerified?: boolean;
};

type FilterKey = "" | "just_started" | "close_to_goal" | "needs_momentum";

const filterOptions: {
  key: FilterKey;
  icon: typeof Megaphone;
  label: string;
  description: string;
}[] = [
  {
    key: "just_started",
    icon: Megaphone,
    label: "Just Started",
    description: "Fundraisers started in the last two days",
  },
  {
    key: "close_to_goal",
    icon: Target,
    label: "Close to Goal",
    description: "Fundraisers near their goal",
  },
  {
    key: "needs_momentum",
    icon: CloudLightning,
    label: "Needs Momentum",
    description: "Fundraisers that need a push",
  },
];

export default function DiscoverCampaigns() {
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("");
  const [api, setApi] = useState<CarouselApi | null>(null);

  const fetchCampaigns = useCallback((filter: FilterKey) => {
    setLoading(true);
    const qs = filter ? `?limit=6&filter=${filter}` : "?limit=6";
    fetch(`/api/campaigns/active${qs}`)
      .then((r) => r.json())
      .then((data: CampaignItem[]) => {
        setItems(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCampaigns(activeFilter);
  }, [activeFilter, fetchCampaigns]);

  const handleFilterChange = (key: FilterKey) => {
    setActiveFilter((prev) => (prev === key ? "" : key));
  };

  const handleShare = (campaign: CampaignItem) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/campaigns/${campaign.slug}`;
    const shareData = {
      title: campaign.title,
      text: campaign.description || "Support this campaign on ib4me",
      url,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
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

  const activeLabel = filterOptions.find((f) => f.key === activeFilter)?.label;

  return (
    <section className="py-14 font-Sora sm:py-18 lg:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Featured <span className="text-blaze-orange">Campaigns</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Every campaign represents a real person in need. Your generosity can
            change lives.
          </p>
        </div>

        {/* Controls row */}
        <div className="mb-8 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                {activeLabel || "Filter Campaigns"}
                <ChevronDown
                  className="-me-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[--radix-dropdown-menu-trigger-width]">
              {filterOptions.map((opt) => {
                const OptIcon = opt.icon;
                return (
                  <DropdownMenuItem
                    key={opt.key}
                    className={`cursor-pointer ${activeFilter === opt.key ? "bg-primary/10" : ""}`}
                    onClick={() => handleFilterChange(opt.key)}
                  >
                    <div
                      className="flex size-8 items-center justify-center rounded-md border bg-background"
                      aria-hidden="true"
                    >
                      <OptIcon
                        size={16}
                        className="text-blaze-orange opacity-60"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {opt.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <button
              onClick={() => api?.scrollPrev()}
              className="cursor-pointer rounded-full border p-2 text-blaze-orange transition-colors hover:bg-blaze-orange/10"
              aria-label="Previous"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              className="cursor-pointer rounded-full border p-2 text-blaze-orange transition-colors hover:bg-blaze-orange/10"
              aria-label="Next"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel / loading / empty */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl bg-card overflow-hidden shadow-sm"
              >
                {/* Image area */}
                <div className="aspect-video bg-muted" />
                <div className="p-6 space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="h-5 w-4/5 rounded-lg bg-muted" />
                    <div className="h-4 w-3/5 rounded-lg bg-muted" />
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-muted" />
                    <div className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-muted" />
                      <div className="h-4 w-10 rounded bg-muted" />
                    </div>
                  </div>
                  {/* Donor row */}
                  <div className="pt-4 border-t border-muted flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {[0,1,2].map(j => <div key={j} className="h-5 w-5 rounded-full bg-muted" />)}
                      </div>
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-14 rounded bg-muted" />
                  </div>
                  {/* Button row */}
                  <div className="flex gap-3 pt-2">
                    <div className="h-9 flex-1 rounded-xl bg-muted" />
                    <div className="h-9 w-9 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderSearch className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              No campaigns found
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              {activeFilter
                ? "Try a different filter or browse all campaigns."
                : "Check back soon for new campaigns."}
            </p>
            {activeFilter && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setActiveFilter("")}
              >
                Clear Filter
              </Button>
            )}
          </div>
        ) : (
          <Carousel setApi={setApi} opts={{ align: "start" }}>
            <CarouselContent>
              {items.map((c) => (
                <CarouselItem key={c.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <CampaignCard
                      title={c.title}
                      description={c.description}
                      imageUrl={c.imageUrl}
                      raised={c.amountRaised}
                      goal={c.goalAmount}
                      donors={c.donationsCount}
                      verified={false}
                      ownerVerified={c.ownerVerified ?? true}
                      urgency={c.urgency}
                      urgent={c.urgency === "high"}
                      href={`/campaigns/${c.slug}`}
                      currency={c.currency || "SLE"}
                      onShare={() => handleShare(c)}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        {/* View all link */}
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-2xl px-8">
            <Link href="/campaigns">
              View All Campaigns
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
