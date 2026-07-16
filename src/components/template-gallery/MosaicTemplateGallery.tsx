"use client";

/**
 * MosaicTemplateGallery — generic template browser (responsive-pair)
 *
 * Ported from components/templates/ (TemplateGallery, TemplateCard,
 *   TemplatePreview, TemplateSelectorModal, QuickStartPanel, AgentTeamPreview)
 * Combined into a single composable module.
 *
 * Exports:
 *   MosaicTemplateGallery     — responsive orchestrator (main entry point)
 *   MosaicTemplateCard        — individual card
 *   MosaicTemplatePreview     — detail preview panel
 *   MosaicQuickStartPanel     — quick-start scenario / preset grid
 *   MosaicAgentTeamPreview    — visual agent team display
 *
 * All domain types (DebateTemplate, AgentTeamPreset, etc.) replaced with
 * generic MosaicTemplate*, MosaicAgentPreset, MosaicScenario types.
 * framer-motion replaced with CSS transitions.
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

export interface MosaicTemplateAgent {
  id: string;
  name: string;
  type?: string;
  accentColor?: string;
}

export interface MosaicTemplateMetadata {
  usageCount?: number;
  tags?: string[];
  createdBy?: string;
  createdAt?: string | Date;
}

export interface MosaicTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  agents?: MosaicTemplateAgent[];
  metadata?: MosaicTemplateMetadata;
  /** "debate" | "collaboration" | "analysis" | string */
  type?: string;
}

export interface MosaicScenario {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tags?: string[];
}

export interface MosaicAgentPreset {
  id: string;
  name: string;
  description?: string;
  agents?: MosaicTemplateAgent[];
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-yellow-500"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-green-500"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
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

// ── MosaicTemplateCard ────────────────────────────────────────────────────────

export interface MosaicTemplateCardProps {
  template: MosaicTemplate;
  isSelected?: boolean;
  onSelect: (template: MosaicTemplate) => void;
  onPreview?: (template: MosaicTemplate) => void;
  onDuplicate?: (template: MosaicTemplate) => void;
  showActions?: boolean;
  compact?: boolean;
  /** Label for the preview action button. Required, no default. */
  previewLabel: string;
  /** Label for the duplicate action button. Required, no default. */
  duplicateLabel: string;
}

export function MosaicTemplateCard({
  template,
  isSelected,
  onSelect,
  onPreview,
  onDuplicate,
  showActions = false,
  compact = false,
  previewLabel,
  duplicateLabel,
}: MosaicTemplateCardProps) {
  const isPopular = (template.metadata?.usageCount ?? 0) > 10;
  const isTrending = (template.metadata?.usageCount ?? 0) > 5;
  const tags = template.metadata?.tags ?? [];

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      data-slot="template-card"
      className={cn(
        "w-full text-left rounded-lg border transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight line-clamp-1">{template.name}</p>
          {template.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isPopular && <StarIcon />}
          {isTrending && <TrendingIcon />}
          {compact && <ChevronRightIcon />}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {template.category}
        </span>
        {template.agents && template.agents.length > 0 && (
          <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {template.agents.length} agents
          </span>
        )}
        {(template.metadata?.usageCount ?? 0) > 0 && (
          <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {template.metadata?.usageCount} uses
          </span>
        )}
        {tags.slice(0, compact ? 1 : 2).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
      </div>

      {showActions && (
        <div className="mt-3 flex gap-2">
          {onPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {previewLabel}
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(template);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {duplicateLabel}
            </button>
          )}
        </div>
      )}
    </button>
  );
}

MosaicTemplateCard.displayName = "MosaicTemplateCard";

// ── MosaicTemplatePreview ─────────────────────────────────────────────────────

export interface MosaicTemplatePreviewProps {
  template: MosaicTemplate;
  onSelect: (template: MosaicTemplate) => void;
  onClose?: () => void;
  /** Label for the "use template" confirm button. Required, no default. */
  selectLabel: string;
  /** Label for the cancel button (shown when `onClose` is set). Required, no default. */
  cancelLabel: string;
  /**
   * Formatter for the "Agents (N)" heading, shown only when `template.agents`
   * is non-empty. Optional — when absent, the heading is not rendered at all
   * (no fallback word). The host owns the language
   * (e.g. `(count) => t('TemplatePreview.agentsCount', { count })`).
   */
  formatAgentsHeading?: (count: number) => string;
}

export function MosaicTemplatePreview({
  template,
  onSelect,
  onClose,
  selectLabel,
  cancelLabel,
  formatAgentsHeading,
}: MosaicTemplatePreviewProps) {
  return (
    <div data-slot="template-preview" className="flex flex-col gap-4 p-4">
      <div>
        <h3 className="text-lg font-semibold">{template.name}</h3>
        {template.description && (
          <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {template.category}
        </span>
        {template.type && (
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            {template.type}
          </span>
        )}
      </div>

      {template.agents && template.agents.length > 0 && (
        <div>
          {formatAgentsHeading && (
            <p className="mb-2 text-sm font-medium">
              {formatAgentsHeading(template.agents.length)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {template.agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1"
              >
                {agent.accentColor && (
                  <span
                    className={cn("h-2 w-2 rounded-full", agent.accentColor)}
                    aria-hidden="true"
                  />
                )}
                <span className="text-xs text-foreground">{agent.name}</span>
                {agent.type && (
                  <span className="text-xs text-muted-foreground">({agent.type})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(template.metadata?.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(template.metadata?.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSelect(template)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {selectLabel}
        </button>
      </div>
    </div>
  );
}

MosaicTemplatePreview.displayName = "MosaicTemplatePreview";

// ── MosaicAgentTeamPreview ────────────────────────────────────────────────────

export interface MosaicAgentTeamPreviewProps {
  agents: MosaicTemplateAgent[];
  label?: string;
}

export function MosaicAgentTeamPreview({ agents, label }: MosaicAgentTeamPreviewProps) {
  return (
    <div data-slot="agent-team-preview" className="flex flex-col gap-3">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
          >
            {agent.accentColor && (
              <span
                className={cn("h-2.5 w-2.5 rounded-full", agent.accentColor)}
                aria-hidden="true"
              />
            )}
            <span className="text-sm font-medium">{agent.name}</span>
            {agent.type && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {agent.type}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

MosaicAgentTeamPreview.displayName = "MosaicAgentTeamPreview";

// ── MosaicQuickStartPanel ─────────────────────────────────────────────────────

export interface MosaicQuickStartPanelProps {
  scenarios?: MosaicScenario[];
  presets?: MosaicAgentPreset[];
  onSelectScenario: (scenario: MosaicScenario) => void;
  onSelectPreset: (preset: MosaicAgentPreset) => void;
  onStartFromScratch?: () => void;
  scenariosTitle?: string;
  presetsTitle?: string;
  scratchLabel?: string;
  className?: string;
}

export function MosaicQuickStartPanel({
  scenarios = [],
  presets = [],
  onSelectScenario,
  onSelectPreset,
  onStartFromScratch,
  scenariosTitle,
  presetsTitle,
  scratchLabel,
  className,
}: MosaicQuickStartPanelProps) {
  return (
    <div data-slot="quick-start-panel" className={cn("flex flex-col gap-6", className)}>
      {scenarios.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{scenariosTitle}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "transition-colors",
                )}
              >
                {scenario.icon && <span className="mt-0.5 shrink-0">{scenario.icon}</span>}
                <div>
                  <p className="text-sm font-medium">{scenario.title}</p>
                  {scenario.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{scenario.description}</p>
                  )}
                  {scenario.tags && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {scenario.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {presets.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">{presetsTitle}</h3>
          <div className="flex flex-col gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left",
                  "hover:border-primary/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "transition-colors",
                )}
              >
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  {preset.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{preset.description}</p>
                  )}
                  {preset.agents && preset.agents.length > 0 && (
                    <div className="mt-2 flex gap-1.5">
                      {preset.agents.map((a) => (
                        <div key={a.id} className="flex items-center gap-1">
                          {a.accentColor && (
                            <span
                              className={cn("h-2 w-2 rounded-full", a.accentColor)}
                              aria-hidden="true"
                            />
                          )}
                          <span className="text-xs text-muted-foreground">{a.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        </div>
      )}

      {onStartFromScratch && (
        <button
          type="button"
          onClick={onStartFromScratch}
          className={cn(
            "inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-border",
            "bg-background px-4 text-sm font-medium text-foreground",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {scratchLabel}
        </button>
      )}
    </div>
  );
}

MosaicQuickStartPanel.displayName = "MosaicQuickStartPanel";

// ── MosaicTemplateGallery (orchestrator) ──────────────────────────────────────

export interface MosaicTemplateGalleryProps {
  templates: MosaicTemplate[];
  selectedTemplate?: MosaicTemplate;
  onSelectTemplate: (template: MosaicTemplate) => void;
  onPreviewTemplate?: (template: MosaicTemplate) => void;
  onDuplicateTemplate?: (template: MosaicTemplate) => void;
  filters?: MosaicFilterOption[];
  selectedFilter: string;
  onFilterChange: (id: string) => void;
  categories?: MosaicFilterOption[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  showActions?: boolean;
  title?: string;
  searchPlaceholder?: string;
  /** Message shown when the filtered template list is empty. Required, no default. */
  emptyMessage: string;
  /** aria-label for the mobile "open filters" button. Required, no default. */
  openFiltersAriaLabel: string;
  /** Title of the filter sidebar / mobile filters modal. Required, no default. */
  filtersTitle: string;
  /** aria-label for the mobile filters modal close button. Required, no default. */
  closeFiltersAriaLabel: string;
  /** Forwarded to MosaicFilterSidebar — required, no default. */
  expandFiltersAriaLabel: string;
  /** Forwarded to MosaicFilterSidebar — required, no default. */
  categoriesHeading: string;
  /** Forwarded to MosaicFilterSidebar — required, no default. */
  collapseSidebarAriaLabel: string;
  /** Forwarded to MosaicFilterSidebar — required, no default. */
  expandSidebarAriaLabel: string;
  /** Required host-owned strings forwarded to every MosaicTemplateCard. */
  previewLabel: string;
  duplicateLabel: string;
  className?: string;
}

function TemplateGalleryContent({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onPreviewTemplate,
  onDuplicateTemplate,
  filters,
  selectedFilter,
  onFilterChange,
  categories,
  selectedCategory,
  onCategoryChange,
  showActions,
  title,
  searchPlaceholder,
  emptyMessage,
  openFiltersAriaLabel,
  filtersTitle,
  closeFiltersAriaLabel,
  expandFiltersAriaLabel,
  categoriesHeading,
  collapseSidebarAriaLabel,
  expandSidebarAriaLabel,
  previewLabel,
  duplicateLabel,
  isMobile,
}: MosaicTemplateGalleryProps & { isMobile: boolean }) {
  const [query, setQuery] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const filtered = templates.filter(
    (t) =>
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const sidebar = (
    <MosaicFilterSidebar
      isCollapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      filters={filters}
      selectedFilter={selectedFilter}
      onFilterChange={
        isMobile
          ? (id) => {
              onFilterChange(id);
              setFilterOpen(false);
            }
          : onFilterChange
      }
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={
        isMobile
          ? (id) => {
              onCategoryChange(id);
              setFilterOpen(false);
            }
          : onCategoryChange
      }
      title={filtersTitle}
      expandFiltersAriaLabel={expandFiltersAriaLabel}
      categoriesHeading={categoriesHeading}
      collapseSidebarAriaLabel={collapseSidebarAriaLabel}
      expandSidebarAriaLabel={expandSidebarAriaLabel}
    />
  );

  if (isMobile) {
    return (
      <div data-slot="template-gallery" className="flex flex-col">
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold">{title}</h1>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </div>
        </div>
        <div className="space-y-3 p-4">
          {filtered.map((template) => (
            <MosaicTemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onSelect={onSelectTemplate}
              onPreview={onPreviewTemplate}
              onDuplicate={onDuplicateTemplate}
              showActions={showActions}
              previewLabel={previewLabel}
              duplicateLabel={duplicateLabel}
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
          title={filtersTitle}
          closeAriaLabel={closeFiltersAriaLabel}
        >
          <div className="p-4">{sidebar}</div>
        </MosaicAdaptiveModal>
      </div>
    );
  }

  return (
    <div data-slot="template-gallery" className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex flex-1 min-h-0">
        {sidebar}
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
                  "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((template) => (
                <MosaicTemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={onSelectTemplate}
                  onPreview={onPreviewTemplate}
                  onDuplicate={onDuplicateTemplate}
                  showActions={showActions}
                  previewLabel={previewLabel}
                  duplicateLabel={duplicateLabel}
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

export function MosaicTemplateGallery(props: MosaicTemplateGalleryProps) {
  const { isMobile } = useDevice();
  return <TemplateGalleryContent {...props} isMobile={isMobile} />;
}

MosaicTemplateGallery.displayName = "MosaicTemplateGallery";
