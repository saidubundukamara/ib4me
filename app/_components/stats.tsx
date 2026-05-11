import { Users, Heart, DollarSign, TrendingUp } from "lucide-react";

export const statDefinitions = [
  {
    key: "totalRaised" as const,
    icon: DollarSign,
    label: "Funds Raised",
    color: "#FF6000",
  },
  {
    key: "totalDonors" as const,
    icon: Users,
    label: "Registered Users",
    color: "#FBB03B",
  },
  {
    key: "totalDonations" as const,
    icon: Heart,
    label: "Donations Made",
    color: "#00712D",
  },
  {
    key: "totalCampaigns" as const,
    icon: TrendingUp,
    label: "Active Campaigns",
    color: "#80E10A",
  },
];

/** @deprecated Use LiveStatsGrid or the /api/stats endpoint instead */
export const stats = statDefinitions.map((s) => ({
  ...s,
  value: "—",
}));
