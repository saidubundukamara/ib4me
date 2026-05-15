"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";


interface DonorEntry {
  name: string;
  amount: string;
  timeAgo: string;
  message?: string;
}

export default function DonorsTicker({ donors }: { donors: DonorEntry[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (donors.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % donors.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [donors.length]);

  if (donors.length === 0) return null;

  const donor = donors[currentIdx];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div
        className={`flex items-start gap-3 transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {donor.name}{" "}
            <span className="font-normal text-muted-foreground">donated</span>{" "}
            <span className="text-primary">{donor.amount}</span>
          </p>
          {donor.message && (
            <p className="mt-0.5 text-xs text-muted-foreground italic line-clamp-1">
              &ldquo;{donor.message}&rdquo;
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{donor.timeAgo}</p>
        </div>
        {donors.length > 1 && (
          <div className="flex shrink-0 gap-1">
            {donors.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === currentIdx ? "bg-primary" : "bg-primary/25"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { timeAgo } from "@/lib/utils";
