"use client";

import { toast } from "sonner";
import CampaignCard from "@/app/_components/CampaignCard";

export type CreatorCampaignItem = {
  id: string;
  slug: string;
  title: string;
  currency: string;
  amountRaised: number;
  goalAmount: number;
  donationsCount: number;
  imageUrl: string;
  verified: boolean;
};

function formatAmount(amount: number, currency: string = "SLE") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  campaigns: CreatorCampaignItem[];
};

export default function CreatorCampaignsGrid({ campaigns }: Props) {
  const handleShare = (campaign: CreatorCampaignItem) => {
    const url =
      typeof window === "undefined"
        ? `/campaigns/${campaign.slug}`
        : `${window.location.origin}/campaigns/${campaign.slug}`;
    const shareData = {
      title: campaign.title,
      text: `${formatAmount(campaign.amountRaised, campaign.currency)} raised of ${formatAmount(campaign.goalAmount, campaign.currency)} goal`,
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((item) => (
        <CampaignCard
          key={item.id}
          title={item.title}
          imageUrl={item.imageUrl}
          raised={item.amountRaised}
          goal={item.goalAmount}
          donors={item.donationsCount}
          currency={item.currency}
          verified={item.verified}
          href={`/campaigns/${item.slug}`}
          onShare={() => handleShare(item)}
        />
      ))}
    </div>
  );
}
