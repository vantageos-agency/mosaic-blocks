"use client";

/**
 * MosaicMarketplaceList — responsive marketplace grid/list (responsive-pair)
 *
 * Ported from components/marketplace/ (marketplace-list.tsx +
 *   desktop/marketplace-list-desktop.tsx + mobile/marketplace-list-mobile.tsx +
 *   MarketplaceFilterSidebar.tsx)
 *
 * Features:
 * - Desktop: filter sidebar + card grid
 * - Mobile: compact list + filter sheet
 * - Install/uninstall action callbacks
 * - Rating stars, download count, price, category badges
 *
 * Reuses MosaicFilterSidebar for filter sidebar.
 * All mock data stripped — items are props.
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicFilterSidebar } from "../filter-sidebar/MosaicFilterSidebar.js";
import type { MosaicFilterOption } from "../filter-sidebar/MosaicFilterSidebar.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMarketplaceItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  rating?: number;
  downloads?: number;
  price?: string;
  isInstalled?: boolean;
  /** Tailwind accent class for the icon bg (e.g. "bg-purple-500/10 text-purple-500") */
  accentClass?: string;
  /** Icon node to render */
  icon?: React.ReactNode;
  tags?: string[];
}

export interface MosaicMarketplaceListProps {
  items: MosaicMarketplaceItem[];
  filters?: MosaicFilterOption[];
  selectedFilter: string;
  onFilterChange: (id: string) => void;
  categories?: MosaicFilterOption[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onInstall?: (itemId: string) => void;
  onUninstall?: (itemId: string) => void;
  onPreview?: (itemId: string) => void;
  title?: string;
  searchPlaceholder?: string;
  installLabel?: string;
  uninstallLabel?: string;
  /**
   * Label for the preview button on each card. Required — host-owned,
   * no default.
   */
  previewLabel: string;
  /**
   * Message shown when the filtered item list is empty. Required —
   * host-owned, no default.
   */
  emptyMessage: string;
  /** aria-label for the mobile "open filters" button. Required, no default. */
  openFiltersAriaLabel: string;
  /** Title of the mobile filters modal. Required, no default. */
  filtersModalTitle: string;
  /** aria-label for the mobile filters modal close button. Required, no default. */
  closeFiltersAriaLabel: string;
  /** Forwarded to MosaicFilterSidebar — required, no default. */
  expandFiltersAriaLabel: string;
  /** Forwarded to MosaicFilterSidebar — required, no default. */
  categoriesHeading: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────

function MarketplaceCard({
  item,
  onInstall,
  onUninstall,
  onPreview,
  installLabel,
  uninstallLabel,
  previewLabel,
  compact = false,
}: {
  item: MosaicMarketplaceItem;
  onInstall?: (id: string) => void;
  onUninstall?: (id: string) => void;
  onPreview?: (id: string) => void;
  installLabel: string;
  uninstallLabel: string;
  previewLabel: string;
  compact?: boolean;
}) {
  const ratingInt = Math.round(item.rating ?? 0);

  return (
    <div
      data-slot="marketplace-card"
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md",
        compact ? "flex items-center gap-3" : "flex flex-col gap-3",
      )}
    >
      {/* Icon */}
      {item.icon && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            compact ? "h-10 w-10" : "h-12 w-12",
            item.accentClass ?? "bg-muted text-muted-foreground",
          )}
        >
          {item.icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("font-semibold leading-tight", compact ? "text-sm" : "text-base")}>
              {item.title}
            </p>
            {item.description && !compact && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            )}
          </div>
          {item.price && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {item.price}
            </span>
          )}
        </div>

        {!compact && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-md border border-border px-2 py-0.5">{item.category}</span>
            {item.rating != null && (
              <span className="flex items-center gap-1 text-yellow-500">
                {([1, 2, 3, 4, 5] as const).map((star) => (
                  <StarIcon key={star} filled={star <= ratingInt} />
                ))}
                <span className="text-muted-foreground">{item.rating.toFixed(1)}</span>
              </span>
            )}
            {item.downloads != null && (
              <span className="flex items-center gap-1">
                <DownloadIcon />
                {item.downloads.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn("flex gap-2", compact ? "shrink-0" : "mt-1")}>
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(item.id)}
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
        {item.isInstalled
          ? onUninstall && (
              <button
                type="button"
                onClick={() => onUninstall(item.id)}
                className={cn(
                  "inline-flex min-h-[36px] items-center justify-center rounded-md",
                  "bg-secondary px-3 text-xs font-medium text-secondary-foreground",
                  "hover:bg-secondary/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {uninstallLabel}
              </button>
            )
          : onInstall && (
              <button
                type="button"
                onClick={() => onInstall(item.id)}
                className={cn(
                  "inline-flex min-h-[36px] items-center justify-center rounded-md",
                  "bg-primary px-3 text-xs font-medium text-primary-foreground",
                  "hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {installLabel}
              </button>
            )}
      </div>
    </div>
  );
}

// ── Desktop variant ───────────────────────────────────────────────────────────

function MarketplaceListDesktop(props: MosaicMarketplaceListProps) {
  const {
    items,
    filters,
    selectedFilter,
    onFilterChange,
    categories,
    selectedCategory,
    onCategoryChange,
    onInstall,
    onUninstall,
    onPreview,
    title = "Marketplace",
    searchPlaceholder = "Search marketplace…",
    installLabel = "Install",
    uninstallLabel = "Uninstall",
    previewLabel,
    emptyMessage,
    expandFiltersAriaLabel,
    categoriesHeading,
  } = props;

  const [query, setQuery] = React.useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const filtered = items.filter(
    (i) =>
      !query ||
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      (i.description ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div data-slot="marketplace-list-desktop" className="flex h-full flex-col">
      <div className="flex items-center border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex flex-1 min-h-0">
        <MosaicFilterSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          filters={filters}
          selectedFilter={selectedFilter}
          onFilterChange={onFilterChange}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          expandFiltersAriaLabel={expandFiltersAriaLabel}
          categoriesHeading={categoriesHeading}
        />
        <div className="flex flex-1 flex-col min-w-0">
          <div className="border-b border-border px-6 py-4">
            <div className="relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3",
                  "text-sm placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <MarketplaceCard
                  key={item.id}
                  item={item}
                  onInstall={onInstall}
                  onUninstall={onUninstall}
                  onPreview={onPreview}
                  installLabel={installLabel}
                  uninstallLabel={uninstallLabel}
                  previewLabel={previewLabel}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile variant ────────────────────────────────────────────────────────────

function MarketplaceListMobile(props: MosaicMarketplaceListProps) {
  const {
    items,
    filters,
    selectedFilter,
    onFilterChange,
    categories,
    selectedCategory,
    onCategoryChange,
    onInstall,
    onUninstall,
    onPreview,
    title = "Marketplace",
    searchPlaceholder = "Search marketplace…",
    installLabel = "Install",
    uninstallLabel = "Uninstall",
    previewLabel,
    emptyMessage,
    openFiltersAriaLabel,
    filtersModalTitle,
    closeFiltersAriaLabel,
    expandFiltersAriaLabel,
    categoriesHeading,
  } = props;

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = items.filter(
    (i) =>
      !query ||
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      (i.description ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div data-slot="marketplace-list-mobile" className="flex flex-col">
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">{title}</h1>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={openFiltersAriaLabel}
          >
            <FilterIcon />
          </button>
        </div>
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        </div>
      </div>

      <div className="space-y-3 p-4">
        {filtered.map((item) => (
          <MarketplaceCard
            key={item.id}
            item={item}
            onInstall={onInstall}
            onUninstall={onUninstall}
            onPreview={onPreview}
            installLabel={installLabel}
            uninstallLabel={uninstallLabel}
            previewLabel={previewLabel}
            compact
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>

      <MosaicAdaptiveModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={filtersModalTitle}
        closeAriaLabel={closeFiltersAriaLabel}
      >
        <div className="p-4">
          <MosaicFilterSidebar
            isCollapsed={false}
            onToggleCollapse={() => setFilterOpen(false)}
            filters={filters}
            selectedFilter={selectedFilter}
            onFilterChange={(id) => {
              onFilterChange(id);
              setFilterOpen(false);
            }}
            categories={categories}
            selectedCategory={selectedCategory}
            expandFiltersAriaLabel={expandFiltersAriaLabel}
            categoriesHeading={categoriesHeading}
            onCategoryChange={(id) => {
              onCategoryChange(id);
              setFilterOpen(false);
            }}
          />
        </div>
      </MosaicAdaptiveModal>
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export function MosaicMarketplaceList(props: MosaicMarketplaceListProps) {
  const { isMobile } = useDevice();
  return isMobile ? <MarketplaceListMobile {...props} /> : <MarketplaceListDesktop {...props} />;
}

MosaicMarketplaceList.displayName = "MosaicMarketplaceList";

export { MarketplaceListDesktop as MosaicMarketplaceListDesktop };
export { MarketplaceListMobile as MosaicMarketplaceListMobile };
