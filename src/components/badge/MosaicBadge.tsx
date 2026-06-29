/**
 * MosaicBadge — style-only badge atom
 *
 * Renders a <span> with cva variants: default, secondary, destructive, outline.
 * data-slot="badge" for composability.
 *
 * Design tokens: Tailwind v4 semantic classes only. No hardcoded colors.
 */

import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { badgeVariants } from "./badge-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  className?: string;
  ref?: React.Ref<HTMLSpanElement>;
}

/**
 * MosaicBadge — inline status/label badge.
 *
 * @example
 * <MosaicBadge>New</MosaicBadge>
 * <MosaicBadge variant="destructive">Error</MosaicBadge>
 * <MosaicBadge variant="outline">Beta</MosaicBadge>
 */
export function MosaicBadge({ className, variant, ref, ...props }: MosaicBadgeProps) {
  return (
    <span
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

MosaicBadge.displayName = "MosaicBadge";

export { badgeVariants };
