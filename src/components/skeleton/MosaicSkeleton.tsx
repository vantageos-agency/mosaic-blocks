/**
 * MosaicSkeleton — loading skeleton primitive for @vantageos/mosaic-blocks.
 *
 * Pulsing placeholder block using the muted token background (animate-pulse bg-muted).
 * Supports shape variants and multi-line text skeletons.
 *
 * Pattern: follows Button.tsx conventions (data-slot, React 19 ref prop,
 * inline cn helper, no "use client" — prepend-use-client.mjs handles dist).
 *
 * Closes issue #20 — replaces DashboardSkeleton + 11+ inline loading sites
 * in vantage-peers-dashboard.
 *
 * @example
 * // Single block
 * <MosaicSkeleton className="h-24 w-full" />
 *
 * @example
 * // Multi-line text placeholder (3 lines, last ~60% width)
 * <MosaicSkeleton variant="text" lines={3} />
 *
 * @example
 * // Avatar circle
 * <MosaicSkeleton variant="circle" className="w-10" />
 *
 * @example
 * // Button-shaped placeholder
 * <MosaicSkeleton variant="button" className="w-24" />
 */

import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { skeletonVariants } from "./skeleton-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Number of stacked text lines to render.
   * Only effective when `variant="text"`. When > 1, renders N lines
   * where the last line is ~60% width to mimic natural text flow.
   * @default 1
   */
  lines?: number;
  /** ref is typed as HTMLDivElement (React 19 prop, no forwardRef needed) */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSkeleton — production loading skeleton atom for @vantageos/mosaic-blocks.
 *
 * Renders an animated placeholder block. Use `variant` to control shape,
 * and `lines` (with `variant="text"`) to render multi-line text skeletons.
 *
 * @example
 * <MosaicSkeleton className="h-24 w-full" />
 * <MosaicSkeleton variant="text" lines={3} />
 * <MosaicSkeleton variant="circle" className="w-10" />
 */
export function MosaicSkeleton({
  className,
  variant,
  lines = 1,
  ref,
  ...props
}: MosaicSkeletonProps) {
  // Multi-line text skeleton: render N stacked lines, last one ~60% width
  if (variant === "text" && lines > 1) {
    // Build a stable key array from the line count — purely positional/static,
    // these placeholder divs never reorder, carry no state, and have no identity.
    const lineKeys = Array.from({ length: lines }, (_, i) => `line-${lines}-${i}`);
    return (
      <div
        ref={ref}
        data-slot="skeleton"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {lineKeys.map((key, i) => (
          <div
            key={key}
            className={cn(skeletonVariants({ variant }), i === lines - 1 && "w-[60%]")}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

MosaicSkeleton.displayName = "MosaicSkeleton";

export { skeletonVariants };
