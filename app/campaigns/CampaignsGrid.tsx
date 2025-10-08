"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CampaignCard from "../_components/CampaignCard"; // Adjust the import path as needed
import FilterCampaign from "../_components/FilterCampaign";

export type CampaignGridItem = {
  id: string;
  slug: string;
  title: string;
  description?: string; // Add this if available in your data source
  currency: string;
  amountRaised: number;
  goalAmount: number;
  donationsCount: number;
  daysLeft?: number; // Add this if available in your data source (e.g., calculate from end date)
  verified?: boolean; // Add this if available
  urgent?: boolean; // Add this if available
  imageUrl: string;
  imageSrcSet?: string;
  imageSizes?: string;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = { items: CampaignGridItem[] };

export default function CampaignsGrid({ items }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="container max-w-screen-xl mx-auto py-16 px-4 font-Sora">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center p-1 rounded-full  max-w-[30rem] w-full border border-primary/10 border-opacity-10 gap-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="rounded-full py-3 px-2 w-full border-2 border-blaze-orange shadow-none focus-visible:ring-0 focus:ring-0 bg-transparent placeholder:text-muted-foreground"
            aria-label="Search"
          />
        </div>
        <FilterCampaign
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedUrgency={selectedUrgency}
          setSelectedUrgency={setSelectedUrgency}
        />
      </div>
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {filtered.length} campaigns</p>
      </div>
      <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          return (
            <Link key={c.id} href={`/campaigns/${c.slug}`} className="block" aria-label={`View details for ${c.title}`}>
              <CampaignCard
                title={c.title}
                description={c.description || `${formatAmount(c.amountRaised, c.currency)} raised of ${formatAmount(c.goalAmount, c.currency)} goal`}
                imageUrl={c.imageUrl}
                raised={c.amountRaised}
                goal={c.goalAmount}
                donors={c.donationsCount}
                daysLeft={c.daysLeft || 30}
                verified={c.verified || false}
                urgent={c.urgent || false}
              />
            </Link>
          );
        })}
      </section>
    </div>
  );
}