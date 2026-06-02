import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

/**
 * Deterministic DiceBear "Notionist" avatar rendered as an inline SVG data URI.
 *
 * Used as a fallback when a user has not uploaded a profile picture
 * (`user.photoUrl`). The same seed always produces the same avatar, so a user
 * looks identical everywhere they appear. Seed with a stable value such as the
 * user `_id`; for entities without an id (e.g. testimonials) use the name.
 */
export function generateAvatarDataUri(seed: string): string {
  return createAvatar(notionists, {
    seed: seed || "anonymous",
  }).toDataUri();
}
