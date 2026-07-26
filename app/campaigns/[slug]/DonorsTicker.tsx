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
  const [animating, setAnimating] = useState(false);
  const paused = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (donors.length <= 1) return;
    const interval = setInterval(() => {
      if (paused.current) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % donors.length);
        setAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [donors.length]);

  if (donors.length === 0) return null;

  const donor = donors[currentIdx];

  return (
    <div
      className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Horizontal slide track */}
      <div
        ref={trackRef}
        className="overflow-x-auto no-scrollbar"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
        onTouchStart={() => { paused.current = true; }}
        onTouchEnd={() => { paused.current = false; }}
      >
        {/* Card */}
        <div
          className={`flex items-start gap-3 px-4 py-3 min-w-0 transition-opacity duration-300 ${
            animating ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Heart icon */}
          <div className="flex h-8 w-8 shrink-0 mt-0.5 items-center justify-center rounded-full bg-primary/15">
            <Heart className="h-3.5 w-3.5 text-primary" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground leading-snug">
              <span className="truncate block max-w-full">{donor.name}</span>
              <span className="font-normal text-muted-foreground text-xs"> donated </span>
              <span className="text-primary font-bold">{donor.amount}</span>
            </p>
            {donor.message && (
              <p className="mt-0.5 text-xs text-muted-foreground italic leading-snug line-clamp-2">
                &ldquo;{donor.message}&rdquo;
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">{donor.timeAgo}</p>
          </div>

          {/* Dot indicators — horizontal */}
          {donors.length > 1 && (
            <div className="flex shrink-0 items-center gap-1 self-center">
              {donors.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to donor ${i + 1}`}
                  onClick={() => {
                    setAnimating(true);
                    setTimeout(() => {
                      setCurrentIdx(i);
                      setAnimating(false);
                    }, 200);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIdx ? "w-4 bg-primary" : "w-1.5 bg-primary/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
