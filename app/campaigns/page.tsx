"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { sampleCampaigns } from "@/lib/campaignsData";

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

const allCategories = [
  "All",
  "Treatments & Procedures",
  "Research & Innovation",
  "Mental Health & Therapy",
  "Equipment & Devices",
  "Patient & Caregiver Support",
  "Community Health Initiatives",
];

export default function CampaignsListPage() {
  const [query, setQuery] = useState("");
  const [category] = useState("All");
  const [urgency] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sampleCampaigns.filter((c) => {
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <main className="py-8 md:py-16">
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="space-y-3 my-7 md:space-y-6">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">Browse fundraisers by category.</h2>
          <p>People around Sierra Leone and the world are raising money for what they are passionate about..</p>
          <Link href="/create-campaign" className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 w-full sm:w-auto">Start a Campaign</Link>
        </div>

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
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm">Category: {category}</button>
            <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm">Urgency: {urgency}</button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {filtered.length} campaigns</p>
          <div className="flex items-center gap-2 text-sm">
            <span>Sort by:</span>
            <select className="border rounded px-2 py-1">
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="most-funded">Most Funded</option>
              <option value="ending-soon">Ending Soon</option>
            </select>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const progress = Math.min(100, Math.round((c.amountRaised / c.goalAmount) * 100));
            return (
              <Link key={c.id} href={`/campaign/${c.id}`} className="block" aria-label={`View details for ${c.title}`}>
                <article className="overflow-hidden rounded-lg border bg-white group">
                  <div className="relative">
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <img src={c.imageUrl} alt={c.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
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

        <div className="flex flex-col items-center justify-center space-y-3 py-8 md:py-16">
          <h2 className="text-balance my-5 text-3xl font-medium lg:text-4xl">Start a fundraiser for yourself or someone else.</h2>
          <Link href="/more-campaigns" className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">Explore more Campaigns</Link>
        </div>
      </div>
    </main>
  );
}


