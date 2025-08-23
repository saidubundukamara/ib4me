"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { sampleCampaigns } from "@/lib/campaignsData";

type PageProps = {
  params: { id: string };
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CampaignByIdPage({ params }: PageProps) {
  const { id } = params;
  const campaign = useMemo(() => sampleCampaigns.find((c) => c.id === id), [id]);
  const [activeTab, setActiveTab] = useState<"story" | "updates" | "comments">("story");

  if (!campaign) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Campaign not found</h1>
        <div className="mt-4">
          <Link href="/campaigns" className="text-sm text-gray-900 underline">
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, Math.round((campaign.amountRaised / campaign.goalAmount) * 100));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border">
            <div className="aspect-[16/9] w-full bg-neutral-100">
              <img src={campaign.imageUrl} alt={campaign.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4 md:p-6">
              <h1 className="text-2xl md:text-3xl font-semibold">{campaign.title}</h1>

              <div className="mt-6">
                <div className="flex gap-2 border-b">
                  <button
                    className={`px-3 py-2 text-sm ${activeTab === "story" ? "border-b-2 border-gray-900 font-medium" : "text-gray-600"}`}
                    onClick={() => setActiveTab("story")}
                  >
                    Story
                  </button>
                  <button
                    className={`px-3 py-2 text-sm ${activeTab === "updates" ? "border-b-2 border-gray-900 font-medium" : "text-gray-600"}`}
                    onClick={() => setActiveTab("updates")}
                  >
                    Updates (1)
                  </button>
                  <button
                    className={`px-3 py-2 text-sm ${activeTab === "comments" ? "border-b-2 border-gray-900 font-medium" : "text-gray-600"}`}
                    onClick={() => setActiveTab("comments")}
                  >
                    Comments (1)
                  </button>
                </div>

                <div className="mt-4 text-sm md:text-base text-gray-800">
                  {activeTab === "story" ? (
                    <p>
                      Help me recover from a severe stroke that has impacted my mobility and daily
                      life.
                    </p>
                  ) : null}
                  {activeTab === "updates" ? (
                    <div className="space-y-2">
                      <h3 className="font-medium">Update #1</h3>
                      <p>Thank you for your support. I had my first therapy session this week.</p>
                    </div>
                  ) : null}
                  {activeTab === "comments" ? (
                    <div className="space-y-2">
                      <h3 className="font-medium">John Smith</h3>
                      <p>Wishing you strength and a speedy recovery.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border p-4 md:p-6">
            <div className="flex items-end gap-2">
              <div className="text-2xl md:text-3xl font-semibold">{formatAmount(campaign.amountRaised, campaign.currency)}</div>
              <div className="text-sm text-gray-600">of {formatAmount(campaign.goalAmount, campaign.currency)} goal</div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-neutral-200">
              <div className="h-2 bg-green-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100">👥</span>
                <span>{campaign.donationsCount} supporters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100">⏳</span>
                <span>30 days left</span>
              </div>
            </div>

            <Link
              href={`/campaigns/${campaign.slug}/donate`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
            >
              Donate Now
            </Link>
          </div>

          <div className="rounded-lg border p-4 md:p-6">
            <h2 className="text-xl font-semibold">Help Share</h2>
            <div className="mt-4 flex items-center gap-2">
              <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">🔗</button>
              <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">🟦</button>
              <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">🟣</button>
              <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">🟢</button>
              <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">✉️</button>
            </div>
          </div>

          <div className="rounded-lg border p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-200" />
              <div>
                <h4 className="font-semibold">Jane Doe</h4>
                <p className="text-sm text-gray-600"><span className="mr-1">Family</span> • <span className="ml-1">Campaign created 2025-03-01</span></p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 md:p-6">
            <h4 className="font-semibold">Recent Donations</h4>
            <div className="mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">John Smith</p>
                  <p className="text-sm text-gray-600">Get well soon!</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatAmount(50, campaign.currency)}</div>
                  <div className="text-xs text-gray-600">2025-03-10</div>
                </div>
              </div>
              <button className="w-full rounded-md border px-3 py-2 text-sm">See All Donations</button>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6">
        <Link href="/campaigns" className="text-sm text-gray-900 underline">
          Back to campaigns
        </Link>
      </div>
    </main>
  );
}


