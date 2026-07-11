"use client";

import { toast } from "sonner";
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
  category?: string;
  description?: string;
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

function handleShare(c: SimilarCampaign) {
  if (typeof window === "undefined") return;
  const url = `${window.location.origin}/campaigns/${c.slug}?ref=similar`;
  const shareData = {
    title: c.title,
    text: `Help ${c.title} — ${formatAmount(c.amountRaised, c.currency)} raised of ${formatAmount(c.goalAmount, c.currency)} goal`,
    url,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share(shareData).catch(() => {});
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
}

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
            description={c.description}
            imageUrl={c.imageUrl}
            raised={c.amountRaised}
            goal={c.goalAmount}
            donors={c.donationsCount}
            verified={c.ownerVerified}
            ownerVerified={c.ownerVerified}
            currency={c.currency}
            category={c.category}
            urgency={c.urgency}
            href={`/campaigns/${c.slug}`}
            onShare={() => handleShare(c)}
          />
        ))}
      </div>
    </div>
  );
}
