"use client";

/**
 * MosaicAgentList — responsive agent list with filter sidebar (responsive-pair)
 *
 * Ported from components/agents/ (agent-list.tsx + desktop/agent-list-desktop.tsx +
 *   mobile/agent-list-mobile.tsx + AgentFilterSidebar.tsx)
 *
 * Features:
 * - Desktop: two-column layout (MosaicFilterSidebar + agent grid)
 * - Mobile: stacked layout with filter sheet (MosaicAdaptiveModal)
 * - Search, filter, category — fully controlled via props
 * - Renders MosaicAgentCard for each agent
 *
 * All debate-specific deps stripped (OrgSwitcher, TokenBalance, QuickActionsMenu,
 * next/navigation router push).
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { MosaicAgentCard } from "../agent-card/MosaicAgentCard.js";
import type { MosaicAgentData } from "../agent-card/MosaicAgentCard.js";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicFilterSidebar } from "../filter-sidebar/MosaicFilterSidebar.js";
import type { MosaicFilterOption } from "../filter-sidebar/MosaicFilterSidebar.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAgentListProps {
  agents: MosaicAgentData[];
  filters?: MosaicFilterOption[];
  selectedFilter: string;
  onFilterChange: (id: string) => void;
  categories?: MosaicFilterOption[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onToggleStatus?: (agentId: string) => void;
  onDeleteAgent?: (agentId: string) => void;
  onEditAgent?: (agentId: string) => void;
  onCreateAgent?: () => void;
  /** Slot for header-right actions (e.g. OrgSwitcher) */
  headerActions?: React.ReactNode;
  title?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

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

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

// ── Desktop variant ───────────────────────────────────────────────────────────

function AgentListDesktop({
  agents,
  filters,
  selectedFilter,
  onFilterChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onToggleStatus,
  onDeleteAgent,
  onEditAgent,
  onCreateAgent,
  headerActions,
  title = "Agents",
  searchPlaceholder = "Search agents…",
  createLabel = "New Agent",
}: MosaicAgentListProps) {
  const [query, setQuery] = React.useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const filtered = agents.filter(
    (a) =>
      !query ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div data-slot="agent-list-desktop" className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          {headerActions}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Filter sidebar */}
        <MosaicFilterSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          filters={filters}
          selectedFilter={selectedFilter}
          onFilterChange={onFilterChange}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Toolbar */}
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
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
              {onCreateAgent && (
                <button
                  type="button"
                  onClick={onCreateAgent}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                    "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <PlusIcon />
                  {createLabel}
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No agents found.</p>
            )}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((agent) => (
                <MosaicAgentCard
                  key={agent.id}
                  agent={agent}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDeleteAgent}
                  onEdit={onEditAgent}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile variant ────────────────────────────────────────────────────────────

function AgentListMobile({
  agents,
  filters,
  selectedFilter,
  onFilterChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onToggleStatus,
  onDeleteAgent,
  onEditAgent,
  onCreateAgent,
  title = "Agents",
  searchPlaceholder = "Search agents…",
  createLabel = "New Agent",
}: MosaicAgentListProps) {
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = agents.filter(
    (a) =>
      !query ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div data-slot="agent-list-mobile" className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md",
                "border border-border bg-background text-foreground",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Open filters"
            >
              <FilterIcon />
            </button>
            {onCreateAgent && (
              <button
                type="button"
                onClick={onCreateAgent}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground",
                  "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <PlusIcon />
                {createLabel}
              </button>
            )}
          </div>
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

      {/* Agent cards */}
      <div className="space-y-3 p-4">
        {filtered.map((agent) => (
          <MosaicAgentCard
            key={agent.id}
            agent={agent}
            onToggleStatus={onToggleStatus}
            onDelete={onDeleteAgent}
            onEdit={onEditAgent}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No agents found.</p>
        )}
      </div>

      {/* Filter modal */}
      <MosaicAdaptiveModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
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

export function MosaicAgentList(props: MosaicAgentListProps) {
  const { isMobile } = useDevice();
  return isMobile ? <AgentListMobile {...props} /> : <AgentListDesktop {...props} />;
}

MosaicAgentList.displayName = "MosaicAgentList";

export { AgentListDesktop as MosaicAgentListDesktop };
export { AgentListMobile as MosaicAgentListMobile };
