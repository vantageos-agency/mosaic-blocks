/**
 * MosaicAvatar — built on @base-ui/react/avatar
 *
 * Uses Avatar.Root + Avatar.Image + Avatar.Fallback from @base-ui/react/avatar.
 * Props: src, alt, fallback, className.
 * data-slot attributes on root ("avatar"), image ("avatar-image"), fallback ("avatar-fallback").
 *
 * Design tokens: Tailwind v4 semantic classes (bg-muted, text-muted-foreground).
 */

import { Avatar } from "@base-ui/react/avatar";
import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicAvatarProps extends Avatar.Root.Props {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Text or node rendered when image is absent or fails to load */
  fallback: React.ReactNode;
  className?: string;
}

/**
 * MosaicAvatar — user avatar with automatic image fallback.
 *
 * @example
 * <MosaicAvatar src="/user.png" alt="John" fallback="JD" />
 * <MosaicAvatar fallback="AB" />
 */
export function MosaicAvatar({ src, alt, fallback, className, ref, ...props }: MosaicAvatarProps) {
  return (
    <Avatar.Root
      ref={ref}
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        "bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Avatar.Image
        src={src ?? ""}
        alt={alt ?? ""}
        data-slot="avatar-image"
        className="aspect-square size-full object-cover"
      />
      <Avatar.Fallback
        data-slot="avatar-fallback"
        className="flex size-full items-center justify-center text-sm font-medium"
      >
        {fallback}
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

MosaicAvatar.displayName = "MosaicAvatar";
