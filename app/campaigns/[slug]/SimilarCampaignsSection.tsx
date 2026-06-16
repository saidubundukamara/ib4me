"use client";

import CampaignCard from "@/app/_components/CampaignCard";

export type SimilarCampaign = {
  id: string;
  slug: string;
  title: string;
  amountRaised: number;
  goalAmount: number;
  donationsCount: number;
  currency: string;
  ownerVerified: boolean;
  imageUrl: string;
};

export default function SimilarCampaignsSection({
  campaigns,
}: {
  campaigns: SimilarCampaign[];
}) {
  if (campaigns.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="mb-6 text-2xl font-bold text-foreground">
        Similar campaigns you may want to support
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            title={c.title}
            imageUrl={c.imageUrl}
            raised={c.amountRaised}
            goal={c.goalAmount}
            donors={c.donationsCount}
            verified={c.ownerVerified}
            ownerVerified={c.ownerVerified}
            currency={c.currency}
            href={`/campaigns/${c.slug}`}
          />
        ))}
      </div>
    </div>
  );
}
