"use client";

/**
 * MosaicMemoryDashboard — landing surface of a knowledge base: a header with
 * a title and a primary "add" action, a row of host-supplied summary
 * statistics, an optional slot for a search bar, a host-controlled view-mode
 * toggle (tiles / rows), and a slot for results.
 *
 * Pure composition — this component never fetches, searches, filters, counts,
 * or invents anything. The statistics are host data (each with its own
 * host-supplied label and value); this component renders exactly the array
 * it is given, in the order it is given, with no minimum or maximum count
 * assumed. Search and results are host-owned React nodes passed in as
 * `searchSlot` and `children` — this component does not implement a search
 * bar or a list itself.
 *
 * The active view mode is a prop (`viewMode`), never internal state invented
 * by this component — toggling it is a callback (`onViewModeChange`) that the
 * host decides how to honor.
 *
 * Every user-facing string is a required prop with no default — this library
 * carries zero words (SIN-01), bilingual FR+EN by design. `searchSlot` and
 * `children` are optional because their absence encodes a real absence of
 * state (no search bar composed / no results yet) — not a missing word.
 *
 * data-slot="memory-dashboard" on the root, data-slot="memory-dashboard-stats"
 * on the stats row, data-slot="memory-dashboard-stat" per stat,
 * data-slot="memory-dashboard-search" on the search slot wrapper (rendered
 * only when `searchSlot` is supplied), data-slot="memory-dashboard-view-toggle"
 * on the toggle group, data-slot="memory-dashboard-results" on the results
 * slot wrapper.
 *
 * Deps: @base-ui/react (via MosaicButton) + class-variance-authority only.
 */

import type * as React from "react";
import { MosaicButton } from "../button/Button.js";
import { memoryDashboardViewToggleButtonVariants } from "./memory-dashboard-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicMemoryDashboardViewMode = "tiles" | "rows";

export interface MosaicMemoryDashboardStat {
  /** Host-owned statistic label — pure data, never invented by this component. */
  label: string;
  /** Host-owned statistic value — pure data, never computed by this component. */
  value: string;
}

export interface MosaicMemoryDashboardProps {
  /** Dashboard title. Required, no default. */
  title: string;
  /** Label for the primary "add" action button. Required, no default. */
  addLabel: string;
  /** Called when the primary "add" action is activated. */
  onAdd: () => void;
  /**
   * Host-supplied summary statistics. Pure data — never fetched, computed, or
   * invented here. Rendered exactly as given, in order, with no assumed count.
   */
  stats: MosaicMemoryDashboardStat[];
  /**
   * Optional host-owned search bar node. Absence means no search bar is
   * composed for this instance — a real absence of state, not a missing word.
   */
  searchSlot?: React.ReactNode;
  /** Current view mode. Host-controlled — this component holds no internal state for it. */
  viewMode: MosaicMemoryDashboardViewMode;
  /** Called with the requested view mode when a toggle button is activated. */
  onViewModeChange: (mode: MosaicMemoryDashboardViewMode) => void;
  /** Label for the "tiles" view toggle button. Required, no default. */
  tilesViewLabel: string;
  /** Label for the "rows" view toggle button. Required, no default. */
  rowsViewLabel: string;
  /**
   * Host-owned results content, rendered in the results slot. Absence means
   * no results have been composed yet — a real absence of state.
   */
  children?: React.ReactNode;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMemoryDashboard — production knowledge-base landing surface for
 * @vantageos/mosaic-blocks.
 *
 * @example
 * <MosaicMemoryDashboard
 *   title="Knowledge base"
 *   addLabel="Add memory"
 *   onAdd={() => openAddMemoryForm()}
 *   stats={[{ label: "Total memories", value: "128" }, { label: "Namespaces", value: "6" }]}
 *   searchSlot={<SearchBar />}
 *   viewMode={viewMode}
 *   onViewModeChange={setViewMode}
 *   tilesViewLabel="Tiles"
 *   rowsViewLabel="Rows"
 * >
 *   <ResultsList />
 * </MosaicMemoryDashboard>
 */
export function MosaicMemoryDashboard({
  title,
  addLabel,
  onAdd,
  stats,
  searchSlot,
  viewMode,
  onViewModeChange,
  tilesViewLabel,
  rowsViewLabel,
  children,
  className,
}: MosaicMemoryDashboardProps) {
  return (
    <div
      data-slot="memory-dashboard"
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-background p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-semibold text-foreground text-lg">{title}</h1>
        <MosaicButton type="button" onClick={onAdd}>
          {addLabel}
        </MosaicButton>
      </div>

      {stats.length > 0 && (
        <div data-slot="memory-dashboard-stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              data-slot="memory-dashboard-stat"
              className="flex flex-col rounded-md border border-border px-3 py-2"
            >
              <span className="font-semibold text-foreground text-lg tabular-nums">
                {stat.value}
              </span>
              <span className="text-muted-foreground text-xs">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {searchSlot && (
        <div data-slot="memory-dashboard-search" className="w-full">
          {searchSlot}
        </div>
      )}

      <div data-slot="memory-dashboard-view-toggle" className="flex items-center gap-2 self-start">
        <button
          type="button"
          aria-pressed={viewMode === "tiles"}
          onClick={() => onViewModeChange("tiles")}
          className={memoryDashboardViewToggleButtonVariants({ pressed: viewMode === "tiles" })}
        >
          {tilesViewLabel}
        </button>
        <button
          type="button"
          aria-pressed={viewMode === "rows"}
          onClick={() => onViewModeChange("rows")}
          className={memoryDashboardViewToggleButtonVariants({ pressed: viewMode === "rows" })}
        >
          {rowsViewLabel}
        </button>
      </div>

      <div data-slot="memory-dashboard-results" className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

MosaicMemoryDashboard.displayName = "MosaicMemoryDashboard";
