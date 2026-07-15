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
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, [donors.length]);

  if (donors.length === 0) return null;

  const donor = donors[currentIdx];

  return (
    /*
     * Fixed height + overflow-hidden: the container never grows or shrinks
     * regardless of content length, preventing any layout shift / shaking.
     * The inner content is absolutely positioned so it never participates
     * in normal flow and cannot push siblings around.
     */
    <div
      className="relative rounded-xl border border-primary/20 bg-primary/5 cursor-default overflow-hidden"
      style={{ height: "5.5rem" }}
      aria-live="polite"
      aria-atomic="true"
      title="Hover to pause"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      <div
        className={`absolute inset-0 flex items-center gap-3 px-4 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Heart icon — fixed size, never changes */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Heart className="h-4 w-4 text-primary" />
        </div>

        {/* Text block — all lines are clamped to 1 line so height is deterministic */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-semibold text-foreground leading-tight">
            {donor.name}{" "}
            <span className="font-normal text-muted-foreground">donated</span>{" "}
            <span className="text-primary">{donor.amount}</span>
          </p>
          {/* Always reserve space for the message line even when empty */}
          <p className="mt-0.5 text-xs text-muted-foreground italic truncate h-4 leading-tight">
            {donor.message ? <>&ldquo;{donor.message}&rdquo;</> : null}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">{donor.timeAgo}</p>
        </div>

        {/* Dot indicators — fixed layout, won't shift */}
        {donors.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            {donors.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  i === currentIdx ? "bg-primary" : "bg-primary/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

