"use client";

import { useEffect, useRef, useState } from "react";
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
  const paused = useRef(false);

  useEffect(() => {
    if (donors.length <= 1) return;
    const interval = setInterval(() => {
      if (paused.current) return;
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
    <div
      className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 cursor-default"
      aria-live="polite"
      aria-atomic="true"
      title="Hover to pause"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      <div
        className={`donors-ticker-item flex items-center gap-3 transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {donor.name}{" "}
            <span className="font-normal text-muted-foreground">donated</span>{" "}
            <span className="text-primary">{donor.amount}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground italic line-clamp-1 min-h-[1rem]">
            {donor.message ? <>&ldquo;{donor.message}&rdquo;</> : null}
          </p>
          <p className="text-xs text-muted-foreground leading-snug">{donor.timeAgo}</p>
        </div>
        {donors.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
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
