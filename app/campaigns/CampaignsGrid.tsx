"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CampaignGridItem = {
  id: string;
  slug: string;
  title: string;
  currency: string;
  amountRaised: number; // major units
  goalAmount: number; // major units
  donationsCount: number;
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

function formatDonationsCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K donations`;
  return `${count} donations`;
}

type Props = { items: CampaignGridItem[] };

export default function CampaignsGrid({ items }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div>
      <div className="flex flex-col items-center space-y-6">
        <div className="w-full max-w-2xl">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-md border px-3 py-2"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {filtered.length} campaigns</p>
      </div>

      <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const progress = c.goalAmount > 0 ? Math.min(100, Math.round((c.amountRaised / c.goalAmount) * 100)) : 0;
          return (
            <Link key={c.id} href={`/campaigns/${c.slug}`} className="block" aria-label={`View details for ${c.title}`}>
              <article className="overflow-hidden rounded-lg border bg-white group">
                <div className="relative">
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img
                      src={c.imageUrl}
                      srcSet={c.imageSrcSet}
                      sizes={c.imageSizes}
                      alt={c.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs sm:text-sm font-medium px-3 py-1 rounded-full">
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
      </section>
    </div>
  );
}


