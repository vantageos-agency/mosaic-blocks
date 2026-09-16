"use client";

/**
 * MosaicTopBar — elevated app-shell top bar (Wave-1 T5, BLOCK 1)
 *
 * Pairs with MosaicAppSidebar to complete the app shell. Sits on the T1
 * elevation-1 level (shadow + highlight edge, `src/theme/depth.css`) so it
 * visually floats above the page ground — never a `border` line, per the
 * operator's "flat" verdict on the HeroUI trials (docs/adr/0002).
 *
 * Search / theme-control / language-control are pure slots (render props):
 * this component owns zero search/theme/i18n logic, it only lays the three
 * zones out. The host wires MosaicThemeToggle, its own search input, and its
 * own language switcher.
 *
 * data-slot="top-bar" on the root, per docs/ARCHITECTURE.md § data-slot.
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicTopBarProps {
  /** Page title / breadcrumb slot, rendered on the left. */
  titleSlot?: React.ReactNode;
  /** Search input slot, rendered centrally. */
  searchSlot?: React.ReactNode;
  /** Theme-control slot (e.g. MosaicThemeToggle), rendered on the right. */
  themeControlSlot?: React.ReactNode;
  /** Language-control slot, rendered on the right, after themeControlSlot. */
  languageControlSlot?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTopBar — floating app-shell header bar with title/search/theme/
 * language slots.
 *
 * @example
 * <MosaicTopBar
 *   titleSlot={<h1>Tableau de bord</h1>}
 *   searchSlot={<input aria-label="Rechercher" />}
 *   themeControlSlot={<MosaicThemeToggle />}
 *   languageControlSlot={<LanguageSwitcher />}
 * />
 */
export function MosaicTopBar({
  titleSlot,
  searchSlot,
  themeControlSlot,
  languageControlSlot,
  className,
  ref,
}: MosaicTopBarProps) {
  return (
    <div
      ref={ref}
      data-slot="top-bar"
      className={cn("flex items-center justify-between gap-4 rounded-xl px-5 py-3", className)}
      style={{
        background: "var(--mosaic-surface-card)",
        boxShadow: "var(--mosaic-elevation-2-highlight), var(--mosaic-elevation-2-shadow)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">{titleSlot}</div>
      {searchSlot && <div className="flex-1 min-w-0 max-w-md">{searchSlot}</div>}
      <div className="flex shrink-0 items-center gap-2">
        {themeControlSlot}
        {languageControlSlot}
      </div>
    </div>
  );
}

MosaicTopBar.displayName = "MosaicTopBar";
