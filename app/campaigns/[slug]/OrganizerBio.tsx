"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateAvatarDataUri } from "@/lib/avatar";

interface OrganizerBioProps {
  organizerId: string;
  organizerName: string;
  organizerInitials: string;
  organizerPhoto: string | null;
  isOwnerVerified: boolean;
  createdLabel: string | null;
  bio: string | null;
}

const BIO_CHAR_LIMIT = 120;

export default function OrganizerBio({
  organizerId,
  organizerName,
  organizerInitials,
  organizerPhoto,
  isOwnerVerified,
  createdLabel,
  bio,
}: OrganizerBioProps) {
  const [expanded, setExpanded] = useState(false);
  const hasBio = !!bio?.trim();
  const isTruncated = hasBio && bio!.length > BIO_CHAR_LIMIT;
  const displayBio = hasBio
    ? isTruncated && !expanded
      ? bio!.slice(0, BIO_CHAR_LIMIT).trimEnd() + "…"
      : bio
    : null;

  return (
    <div className="rounded-2xl bg-muted/40 p-3 hover:bg-muted/60 transition-colors">
      <Link href={`/creators/${organizerId}`} className="flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage
            src={organizerPhoto ?? generateAvatarDataUri(organizerId)}
            alt={organizerName}
          />
          <AvatarFallback>{organizerInitials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors">
              {organizerName}
            </p>
            {!isOwnerVerified && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                title="This organizer has not completed identity verification"
              >
                Unverified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Campaign organizer{createdLabel ? ` • Created ${createdLabel}` : ""}
          </p>
        </div>
      </Link>

      {/* Bio — always visible, expandable on small screens */}
      {hasBio && (
        <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
          <span>{displayBio}</span>
          {isTruncated && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 font-semibold text-primary hover:underline focus:outline-none"
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
