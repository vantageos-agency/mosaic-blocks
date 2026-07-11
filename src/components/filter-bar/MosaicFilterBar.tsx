/**
 * MosaicFilterBar — responsive horizontal control bar for filter rows
 *
 * Presentational layout atom. Unifies VP dashboard filter rows
 * (ActivityTypeFilter, ChannelFilter, HistoryFiltersBar, OrchestratorFilter,
 * StatsTimeWindow) into a single consistent, bilingual-safe container.
 *
 * Pattern: Button.tsx (data-slot, inline cn, React 19 ref prop, displayName, JSDoc).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 *
 * Closes issue #21 — mosaic-filter-bar.
 *
 * @example
 * // Basic usage — controls only
 * <MosaicFilterBar>
 *   <Select ... />
 *   <Select ... />
 * </MosaicFilterBar>
 *
 * @example
 * // With label and clear affordance (bilingual)
 * <MosaicFilterBar
 *   label="Filtres"
 *   onClearAll={() => resetFilters()}
 *   clearLabel="Réinitialiser"
 * >
 *   <ActivityTypeFilter />
 *   <ChannelFilter />
 * </MosaicFilterBar>
 *
 * @example
 * // Space-between layout (label pinned left, clear pinned right)
 * <MosaicFilterBar label="Historique" onClearAll={clear} align="between">
 *   <DateRangePicker />
 * </MosaicFilterBar>
 */

import type * as React from "react";
import { MosaicButton } from "../button/Button.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicFilterBarProps {
  /**
   * Optional leading label / title rendered before the filter controls.
   * Caller owns the node — pass translated strings for FR/EN support.
   */
  label?: React.ReactNode;
  /**
   * The filter controls (Select, DatePicker, Toggle, etc.).
   * Caller-owned — this component is a presentational layout wrapper only.
   */
  children: React.ReactNode;
  /**
   * When provided, renders a trailing "Clear" ghost button that calls this
   * handler when clicked. When absent, no Clear button is rendered.
   */
  onClearAll?: () => void;
  /**
   * Label for the Clear button (shown only when `onClearAll` is set).
   * Required — the host owns the language (e.g. FR: "Réinitialiser"). No
   * default, no fallback.
   */
  clearLabel: React.ReactNode;
  /**
   * Layout alignment of the bar contents.
   * - `"start"` (default) — all controls grouped at the leading edge
   * - `"between"` — label at leading edge, clear button at trailing edge,
   *   controls fill the middle
   */
  align?: "start" | "between";
  /** Additional Tailwind classes forwarded to the root element. */
  className?: string;
  /** React 19 ref prop — no forwardRef wrapper needed. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * MosaicFilterBar — responsive filter/control bar for @vantageos/mosaic-blocks.
 *
 * Wraps a row of filter controls (passed as children) with optional leading
 * label and trailing clear affordance. Mobile-first: wraps to multiple lines
 * on narrow viewports. Bilingual-safe: all user-facing strings are props.
 *
 * @example
 * <MosaicFilterBar label="Filters" onClearAll={reset} clearLabel="Clear all">
 *   <MosaicSelect ... />
 *   <MosaicSelect ... />
 * </MosaicFilterBar>
 */
export function MosaicFilterBar({
  label,
  children,
  onClearAll,
  clearLabel,
  align = "start",
  className,
  ref,
}: MosaicFilterBarProps) {
  const isBetween = align === "between";

  return (
    <div
      ref={ref}
      data-slot="filter-bar"
      className={cn(
        "flex flex-wrap items-center gap-2",
        isBetween ? "justify-between" : "justify-start",
        className,
      )}
    >
      {label != null && (
        <span
          data-slot="filter-bar-label"
          className="shrink-0 text-sm font-medium text-muted-foreground"
        >
          {label}
        </span>
      )}

      <div
        data-slot="filter-bar-controls"
        className={cn("flex flex-wrap items-center gap-2", isBetween && "flex-1")}
      >
        {children}
      </div>

      {onClearAll != null && (
        <MosaicButton
          data-slot="filter-bar-clear"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="shrink-0"
        >
          {clearLabel}
        </MosaicButton>
      )}
    </div>
  );
}

MosaicFilterBar.displayName = "MosaicFilterBar";
