"use client";

/**
 * MosaicSelectorModal — generic searchable item picker modal
 *
 * Ported from components/agent-config/FrameworkSelector / PersonaSelector / RoleSelector
 * combined into a single generic pattern.
 *
 * Features:
 * - Search bar
 * - Optional tab/category filter
 * - Card grid (1 or 2 columns) with selection state
 * - Multi-step stepper support (prev/next) when used inside AgentBuilderModal
 * - "Preview" slot for selected item detail
 *
 * Domain data (items, categories) are fully externalized via props.
 * framer-motion replaced with CSS transitions.
 * Rendered inside MosaicAdaptiveModal (wave-1).
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSelectorItem {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  /** Optional icon or emoji */
  icon?: React.ReactNode;
  /** Category key for tab filtering */
  category?: string;
  /** Additional metadata to surface in cards */
  meta?: Record<string, string | number | boolean>;
}

export interface MosaicSelectorCategory {
  id: string;
  label: string;
}

export interface MosaicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Optional description under title */
  description?: string;
  items: MosaicSelectorItem[];
  /** Currently selected item id */
  selectedId?: string;
  onSelect: (item: MosaicSelectorItem) => void;
  /** If provided, renders category tabs */
  categories?: MosaicSelectorCategory[];
  /** Search placeholder text. Required, no default. */
  searchPlaceholder: string;
  /** Number of columns in the grid (1 or 2, default 2) */
  columns?: 1 | 2;
  /** Slot rendered alongside selected item for preview */
  renderPreview?: (item: MosaicSelectorItem) => React.ReactNode;
  /** Confirm button label. Required, no default. */
  confirmLabel: string;
  /** Cancel button label. Required, no default. */
  cancelLabel: string;
  /** Label for the "All" category tab. Required, no default. */
  allCategoryLabel: string;
  /** Message shown when the filtered item grid is empty. Required, no default. */
  emptyMessage: string;
  /** aria-label for the modal close button. Required, no default. */
  closeAriaLabel: string;
  className?: string;
}

// ── Search icon (inline SVG) ──────────────────────────────────────────────────

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

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicSelectorModal({
  isOpen,
  onClose,
  title,
  description,
  items,
  selectedId,
  onSelect,
  categories,
  searchPlaceholder,
  columns = 2,
  renderPreview,
  confirmLabel,
  cancelLabel,
  allCategoryLabel,
  emptyMessage,
  closeAriaLabel,
}: MosaicSelectorModalProps) {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [pendingId, setPendingId] = React.useState<string | undefined>(selectedId);

  // Reset pending when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setPendingId(selectedId);
      setQuery("");
      setActiveCategory("all");
    }
  }, [isOpen, selectedId]);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q) ||
      (item.tags ?? []).some((t) => t.toLowerCase().includes(q));
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const pendingItem = pendingId ? items.find((i) => i.id === pendingId) : undefined;

  const handleConfirm = () => {
    if (pendingItem) {
      onSelect(pendingItem);
    }
    onClose();
  };

  return (
    <MosaicAdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      closeAriaLabel={closeAriaLabel}
    >
      <div data-slot="selector-modal" className="flex flex-col gap-4 p-4">
        {/* Search */}
        <div className="relative">
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
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        </div>

        {/* Category tabs */}
        {categories && categories.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {allCategoryLabel}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Item grid */}
        <div
          className={cn(
            "max-h-[50vh] overflow-y-auto",
            columns === 2 ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "flex flex-col gap-3",
          )}
        >
          {filtered.map((item) => {
            const isSelected = pendingId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPendingId(item.id)}
                className={cn(
                  "group relative rounded-lg border p-4 text-left transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon />
                  </span>
                )}
                <div className="flex items-start gap-2">
                  {item.icon && <span className="mt-0.5 shrink-0">{item.icon}</span>}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
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
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
        </div>

        {/* Preview slot */}
        {renderPreview && pendingItem && (
          <div className="rounded-lg border border-border bg-card p-4">
            {renderPreview(pendingItem)}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center rounded-md border border-border",
              "bg-background px-4 py-2 text-sm font-medium text-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pendingItem}
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center rounded-md",
              "bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </MosaicAdaptiveModal>
  );
}

MosaicSelectorModal.displayName = "MosaicSelectorModal";
