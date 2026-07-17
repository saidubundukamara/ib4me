"use client";

import { Heart } from "lucide-react";

interface DonorEntry {
  name: string;
  amount: string;
  timeAgo: string;
  message?: string;
}

export default function DonorsTicker({ donors }: { donors: DonorEntry[] }) {
  if (donors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" aria-label="Recent donations">
      {donors.map((donor, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Heart className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-foreground">
              {donor.name}{" "}
              <span className="font-normal text-muted-foreground">donated</span>{" "}
              <span className="text-primary">{donor.amount}</span>
            </p>
            {donor.message && (
              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                &ldquo;{donor.message}&rdquo;
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{donor.timeAgo}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
