"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { Users, Heart, DollarSign, TrendingUp } from "lucide-react";

interface PlatformStats {
  totalCampaigns: number;
  totalDonations: number;
  totalDonors: number;
  totalRaisedMinor: number;
}

function formatRaised(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export function usePlatformStats() {
  const [data, setData] = useState<PlatformStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  return data;
}

export function getStatItems(data: PlatformStats | null) {
  const totalRaised = data ? data.totalRaisedMinor / 100 : 0;

  return [
    {
      icon: DollarSign,
      value: totalRaised,
      label: "Funds Raised",
      color: "#FF6000",
      format: formatRaised,
      prefix: "SLE ",
    },
    {
      icon: Users,
      value: data?.totalDonors ?? 0,
      label: "Registered Users",
      color: "#FBB03B",
    },
    {
      icon: Heart,
      value: data?.totalDonations ?? 0,
      label: "Donations Made",
      color: "#00712D",
    },
    {
      icon: TrendingUp,
      value: data?.totalCampaigns ?? 0,
      label: "Active Campaigns",
      color: "#80E10A",
    },
  ];
}

/**
 * Renders a single stat with CountUp animation.
 * Use inside your own grid layout.
 */
export function StatItem({
  stat,
  loaded,
}: {
  stat: ReturnType<typeof getStatItems>[number];
  loaded: boolean;
}) {
  const Icon = stat.icon;
  return (
    <>
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:mb-4 sm:h-14 sm:w-14"
        style={{ backgroundColor: `${stat.color}20` }}
      >
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: stat.color }} aria-hidden="true" />
      </div>
      <div
        className="mb-1.5 text-xl font-bold sm:mb-2 sm:text-2xl lg:text-3xl xl:text-4xl"
        style={{ color: stat.color }}
      >
        {stat.prefix ?? ""}
        {loaded ? (
          <CountUp
            start={0}
            end={stat.value}
            duration={2.5}
            separator=","
            formattingFn={stat.format}
          />
        ) : (
          "—"
        )}
      </div>
      <div className="text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
    </>
  );
}
