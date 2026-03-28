"use client";

import { useEffect, useState } from "react";
import { usePlatformStats, getStatItems, StatItem } from "./LiveStatsGrid";

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const data = usePlatformStats();
  const stats = getStatItems(data);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="border-b border-border bg-muted/20 py-14 sm:py-18 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-2xl space-y-4 text-center sm:space-y-6">
          <h2 className="font-Sora text-3xl font-semibold sm:text-4xl lg:text-5xl">
            ib4me in <span className="text-fun-green">numbers</span>
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base lg:text-lg">
            Join thousands of people who have successfully funded their causes
            and helped others in need.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 font-Sora sm:mt-12 sm:gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex h-full flex-col items-center text-center transition-all duration-700 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              } motion-reduce:transform-none motion-reduce:opacity-100`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <StatItem stat={stat} loaded={!!data} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
