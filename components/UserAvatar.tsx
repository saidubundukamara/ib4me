"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarDataUri } from "@/lib/avatar";

type UserAvatarProps = {
  /** Uploaded profile picture URL. When absent, a Notionist avatar is generated. */
  photoUrl?: string | null;
  /** Stable seed for the generated avatar (user `_id`, or name when no id exists). */
  seed: string;
  /** Display name, used for the alt text and the initial fallback. */
  name?: string | null;
  /** Classes applied to the Avatar root (e.g. sizing). */
  className?: string;
  /** Classes applied to the AvatarImage (e.g. object-cover). */
  imgClassName?: string;
};

/**
 * Renders a user's uploaded photo, falling back to a deterministic DiceBear
 * "Notionist" avatar (seeded by `seed`) and finally to a text initial.
 */
export function UserAvatar({
  photoUrl,
  seed,
  name,
  className,
  imgClassName,
}: UserAvatarProps) {
  const src = useMemo(
    () => photoUrl ?? generateAvatarDataUri(seed),
    [photoUrl, seed],
  );
  const initial = (name?.trim().charAt(0) || "U").toUpperCase();

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={name || "User avatar"} className={imgClassName} />
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;
