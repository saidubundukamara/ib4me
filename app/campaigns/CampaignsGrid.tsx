"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Filter, Search, SearchX } from "lucide-react";
import CampaignCard from "../_components/CampaignCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getCategoryIcon } from "@/lib/category-icons";

export type CampaignGridItem = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  currency: string;
  amountRaised: number;
  goalAmount: number;
  donationsCount: number;
  verified?: boolean;
  ownerVerified?: boolean;
  urgent?: boolean;
  imageUrl: string;
  imageSrcSet?: string;
  imageSizes?: string;
  category?: string;
  urgency?: "low" | "medium" | "high";
};

function formatAmount(amount: number, currency: string = "SLE") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type CategoryInfo = { name: string; slug: string; icon: string | null };
type Props = { items: CampaignGridItem[]; categories: CategoryInfo[] };

export default function CampaignsGrid({ items, categories }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [visibleCount, setVisibleCount] = useState(9);
  const ITEMS_PER_PAGE = 9;

  const searchParams = useSearchParams();

  // On mount, read ?category= from URL and pre-select it
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    if (categorySlug && categories.length > 0) {
      const match = categories.find((c) => c.slug === categorySlug);
      if (match) {
        setSelectedCategory(match.name);
      }
    }
  }, [searchParams, categories]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [query, selectedCategory, selectedUrgency, items]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !c.title.toLowerCase().includes(q)) return false;
      if (selectedCategory !== "All" && c.category !== selectedCategory) return false;
      if (selectedUrgency !== "All" && c.urgency !== selectedUrgency) return false;
      return true;
    });
  }, [items, query, selectedCategory, selectedUrgency]);

  const displayed = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filtered.length));
  };

  const handleClearFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setSelectedUrgency("All");
  };

  const hasActiveFilters = query.trim() !== "" || selectedCategory !== "All" || selectedUrgency !== "All";

  return (
    <div className="py-10 font-Sora">
      <div className="flex flex-col items-center space-y-5">
        {/* Search + Urgency Row */}
        <div className="flex w-full max-w-2xl items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Search campaigns"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shrink-0 rounded-full">
                <Filter className="mr-2 h-4 w-4" />
                {selectedUrgency === "All" ? "Urgency" : selectedUrgency.charAt(0).toUpperCase() + selectedUrgency.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["All", "high", "medium", "low"].map((u) => (
                <DropdownMenuItem key={u} onSelect={() => setSelectedUrgency(u)}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category Pills */}
        <div className="flex w-full max-w-4xl flex-wrap justify-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              selectedCategory === "All"
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selectedCategory === cat.name
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {displayed.length} of {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
        </p>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Campaigns Grid */}
      {displayed.length > 0 ? (
        <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((c, idx) => {
            const handleShare = () => {
              const url =
                typeof window === "undefined"
                  ? `/campaigns/${c.slug}`
                  : `${window.location.origin}/campaigns/${c.slug}`;
              const shareData = {
                title: c.title,
                text:
                  c.description ||
                  `${formatAmount(c.amountRaised, c.currency)} raised of ${formatAmount(c.goalAmount, c.currency)} goal`,
                url,
              };

              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share(shareData).catch(() => {
                  /* user cancelled */
                });
                return;
              }

              if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                navigator.clipboard
                  .writeText(url)
                  .then(() => toast.success("Campaign link copied"))
                  .catch(() => toast.error("Unable to copy link"));
              } else {
                toast.info("Share not supported on this device");
              }
            };

            return (
              <div
                key={c.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(idx % 9, 8) * 60}ms` }}
              >
              <CampaignCard
                title={c.title}
                description={c.description}
                imageUrl={c.imageUrl}
                raised={c.amountRaised}
                goal={c.goalAmount}
                donors={c.donationsCount}
                verified={c.verified || false}
                ownerVerified={c.ownerVerified ?? true}
                urgent={c.urgent || c.urgency === "high" || false}
                urgency={c.urgency}
                category={c.category}
                href={`/campaigns/${c.slug}`}
                onShare={handleShare}
                currency={c.currency || "SLE"}
              />
              </div>
            );
          })}
        </section>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center space-y-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No campaigns found</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {query.trim()
              ? `No campaigns match "${query.trim()}". Try a different search term or clear filters.`
              : "No campaigns match your current filters. Try adjusting your selection."}
          </p>
          <Button variant="outline" className="rounded-full" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {canLoadMore && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={handleLoadMore}
          >
            Load More ({remaining > ITEMS_PER_PAGE ? ITEMS_PER_PAGE : remaining} more)
          </Button>
        </div>
      )}
    </div>
  );
}
