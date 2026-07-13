"use client";

/**
 * MosaicMarketplaceCard — standalone agent-type gallery tile (M1)
 *
 * Ported from any-debate-ai components/marketplace/desktop/marketplace-card-desktop.tsx
 * and components/marketplace/mobile/marketplace-card-mobile.tsx.
 *
 * This is the tile shown for an agent-type inside a PUBLIC gallery — what a
 * visitor sees before adopting someone else's work. Distinct from the private
 * `MarketplaceCard` embedded inside MosaicMarketplaceList (which is coupled to
 * that list's filter/search state and not exported standalone): this card is a
 * composable, standalone atom usable in any grid, storybook page, or gallery
 * outside a filtered list context.
 *
 * SIN-01: every visible string (adopt/unadopt/preview labels, rating label,
 * mentions) is a required prop with no default. No popularity threshold, no
 * computed rating judgement, no host-decided badge — mentions are plain
 * strings supplied by the caller.
 *
 * Composes MosaicCard sub-parts + MosaicBadge rather than re-implementing
 * card chrome or badge chrome.
 */

import type * as React from "react";
import { MosaicBadge } from "../badge/MosaicBadge.js";
import { MosaicCard, MosaicCardDescription, MosaicCardTitle } from "../card/MosaicCard.js";
import { marketplaceCardVariants } from "./marketplace-card-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMarketplaceCardProps {
  /** Stable identifier forwarded to onAdopt/onUnadopt/onPreview. */
  id: string;
  /** Agent-type name. Required content. */
  name: string;
  /** Optional agent-type description. */
  description?: string;
  /** Icon/avatar node rendered at the top of the card. */
  icon?: React.ReactNode;
  /** Host-provided rating value (e.g. 4.8). No computed threshold or judgement. */
  rating?: number;
  /** Host-provided plain-text mentions/badges (e.g. "Verified", "New"). No lib-decided badges. */
  mentions?: string[];
  /** Whether this agent-type is already adopted by the viewer. */
  isAdopted?: boolean;
  /** Called with `id` when the adopt action is invoked. */
  onAdopt?: (id: string) => void;
  /** Called with `id` when the unadopt action is invoked. */
  onUnadopt?: (id: string) => void;
  /** Called with `id` when the preview action is invoked. Preview button renders only when provided. */
  onPreview?: (id: string) => void;
  /** Label for the adopt action button. Required — host-owned, no default. */
  adoptLabel: string;
  /** Label for the unadopt action button. Required — host-owned, no default. */
  unadoptLabel: string;
  /** Label for the preview action button. Required — host-owned, no default. */
  previewLabel: string;
  /** Accessible suffix rendered next to the rating value (e.g. "out of 5"). Required — host-owned, no default. */
  ratingLabel: string;
  /** Layout variant. */
  variant?: "default" | "compact";
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMarketplaceCard — standalone tile for an agent-type in a public gallery.
 *
 * @example
 * <MosaicMarketplaceCard
 *   id="agent-42"
 *   name="Vantage Researcher"
 *   description="Deep research agent for market analysis"
 *   mentions={["Verified"]}
 *   onAdopt={(id) => adopt(id)}
 *   onPreview={(id) => openPreview(id)}
 *   adoptLabel="Adopt"
 *   unadoptLabel="Remove"
 *   previewLabel="Preview"
 *   ratingLabel="out of 5"
 * />
 */
export function MosaicMarketplaceCard({
  id,
  name,
  description,
  icon,
  rating,
  mentions,
  isAdopted = false,
  onAdopt,
  onUnadopt,
  onPreview,
  adoptLabel,
  unadoptLabel,
  previewLabel,
  ratingLabel,
  variant = "default",
  className,
}: MosaicMarketplaceCardProps) {
  const compact = variant === "compact";

  return (
    <MosaicCard
      data-slot="marketplace-card"
      className={cn(marketplaceCardVariants({ variant }), className)}
    >
      {icon && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            compact ? "h-10 w-10" : "h-12 w-12",
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <MosaicCardTitle className={cn("truncate", compact ? "text-sm" : "text-base")}>
          {name}
        </MosaicCardTitle>

        {description && (
          <MosaicCardDescription
            data-slot="marketplace-card-description"
            className="mt-1 line-clamp-2"
          >
            {description}
          </MosaicCardDescription>
        )}

        {mentions && mentions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {mentions.map((mention) => (
              <MosaicBadge key={mention} variant="secondary">
                {mention}
              </MosaicBadge>
            ))}
          </div>
        )}

        {rating != null && (
          <div
            data-slot="marketplace-card-rating"
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"
          >
            <span className="font-medium text-foreground">{rating}</span>
            <span>{ratingLabel}</span>
          </div>
        )}
      </div>

      <div className={cn("flex gap-2", compact ? "shrink-0" : "mt-1")}>
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(id)}
            className={cn(
              "inline-flex min-h-[36px] items-center justify-center rounded-md border border-border",
              "bg-background px-3 text-xs font-medium text-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {previewLabel}
          </button>
        )}
        {isAdopted
          ? onUnadopt && (
              <button
                type="button"
                onClick={() => onUnadopt(id)}
                className={cn(
                  "inline-flex min-h-[36px] items-center justify-center rounded-md",
                  "bg-secondary px-3 text-xs font-medium text-secondary-foreground",
                  "hover:bg-secondary/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {unadoptLabel}
              </button>
            )
          : onAdopt && (
              <button
                type="button"
                onClick={() => onAdopt(id)}
                className={cn(
                  "inline-flex min-h-[36px] items-center justify-center rounded-md",
                  "bg-primary px-3 text-xs font-medium text-primary-foreground",
                  "hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {adoptLabel}
              </button>
            )}
      </div>
    </MosaicCard>
  );
}

MosaicMarketplaceCard.displayName = "MosaicMarketplaceCard";

export { marketplaceCardVariants };
