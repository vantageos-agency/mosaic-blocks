"use client";

/**
 * MosaicFilterSidebar — generic collapsible filter sidebar
 *
 * Ported from components/agents/AgentFilterSidebar.tsx
 *
 * Features:
 * - Collapsible (64px icon-only / expanded)
 * - Filter tabs (e.g. "All", "Favorites", "Templates")
 * - Category list with counts
 * - Fully generic — labels, filters, categories are props
 *
 * framer-motion replaced with CSS transitions.
 * useDevice used for mobile/tablet width adjustment.
 */

import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicFilterOption {
  id: string;
  label: string;
  count?: number | null;
}

export interface MosaicFilterSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** Top-level filter tabs (e.g. All / Favorites / Templates) */
  filters?: MosaicFilterOption[];
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
  /** Category list */
  categories?: MosaicFilterOption[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  /** Optional title for the sidebar */
  title?: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 18 15 12 9 6" />
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

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicFilterSidebar({
  isCollapsed,
  onToggleCollapse,
  filters = [],
  selectedFilter,
  onFilterChange,
  categories = [],
  selectedCategory,
  onCategoryChange,
  title = "Filters",
  className,
}: MosaicFilterSidebarProps) {
  const { isMobile, isTablet } = useDevice();

  const width = isMobile
    ? "100%"
    : isTablet
      ? isCollapsed
        ? "64px"
        : "280px"
      : isCollapsed
        ? "64px"
        : "320px";

  return (
    <div
      data-slot="filter-sidebar"
      style={{ width, minWidth: isCollapsed && !isMobile ? "64px" : undefined }}
      className={cn(
        "relative flex flex-col border-r border-border bg-card",
        "transition-[width] duration-200 ease-in-out",
        "overflow-hidden",
        className,
      )}
    >
      {/* Toggle button */}
      {!isMobile && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full",
            "border border-border bg-background shadow-sm",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      )}

      {/* Collapsed icon-only view */}
      {isCollapsed && !isMobile && (
        <div className="flex flex-col items-center gap-4 p-3 pt-6">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Expand filters"
          >
            <FilterIcon />
          </button>
        </div>
      )}

      {/* Expanded content */}
      {(!isCollapsed || isMobile) && (
        <div className="flex flex-col gap-4 overflow-y-auto p-4 h-full">
          {/* Title */}
          <div className="flex items-center gap-2">
            <FilterIcon />
            <span className="font-semibold text-sm">{title}</span>
          </div>

          {/* Filter tabs */}
          {filters.length > 0 && (
            <div className="flex flex-col gap-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFilterChange(f.id)}
                  className={cn(
                    "flex min-h-[40px] items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                    "transition-colors hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedFilter === f.id ? "bg-primary/10 text-primary" : "text-foreground",
                  )}
                >
                  <span>{f.label}</span>
                  {f.count != null && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange(cat.id)}
                    className={cn(
                      "flex min-h-[36px] items-center justify-between rounded-md px-3 py-1.5 text-sm",
                      "transition-colors hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedCategory === cat.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground",
                    )}
                  >
                    <span className="text-left leading-snug">{cat.label}</span>
                    {cat.count != null && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {cat.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

MosaicFilterSidebar.displayName = "MosaicFilterSidebar";
