"use client";

/**
 * MosaicArtifactLibrary — org-scoped list/search of saved artifacts, opening
 * a selected one through the C1 adapter (MosaicArtifactCanvasAdapter) + C2
 * renderers.
 *
 * Reuse: composed from the closest any-debate-ai pattern —
 * components/artifacts/organization/ArtifactLibrary.tsx (search + type
 * filter + grid/list of saved artifacts) — stripped of its bulk-actions,
 * folders/tags organizer (`artifactOrganizer`), framer-motion, and shadcn/ui
 * deps to keep this a pure, contract-agnostic list component per the C1
 * adapter's own doctrine. Persistence, org-scoping, and folders/tags are the
 * host's concern: this component accepts a flat `items` array plus
 * `onSelect`/`source` props — no backend, no hardcoded business data.
 *
 * data-slot="artifact-library" on the root, "artifact-library-search" on
 * the search input, "artifact-library-list" on the item list,
 * "artifact-library-item" per item, "artifact-library-canvas" on the
 * forwarded MosaicArtifactCanvasAdapter.
 *
 * i18n: zero hardcoded user-facing strings (mosaic-blocks doctrine — see
 * src/__tests__/i18n-no-hardcoded-literals.test.ts). Every label is a
 * required prop; the host owns the language.
 */

import * as React from "react";
import {
  MosaicArtifactCanvasAdapter,
  type MosaicArtifactCanvasAdapterLabels,
} from "../artifact-canvas-adapter/MosaicArtifactCanvasAdapter.js";
import type { ArtifactCanvasSource, ArtifactType } from "../artifact-canvas-adapter/types.js";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface MosaicArtifactLibraryItem {
  id: string;
  type: ArtifactType;
  title: string;
  /** Host-formatted "last updated" string (locale/timezone owned by the host). */
  updatedAtLabel: string;
}

export interface MosaicArtifactLibraryProps {
  /** Saved artifacts to list/search. Host-supplied — no backend, no org logic baked in. */
  items: MosaicArtifactLibraryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Runtime source for the currently selected artifact; `null` renders the adapter's empty state. */
  source: ArtifactCanvasSource | null;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  onCloseCanvas: () => void;
  /** Section heading. Required, no default. */
  title: string;
  /** Search input placeholder. Required, no default. */
  searchPlaceholder: string;
  /** Message shown when the filtered item list is empty. Required, no default. */
  emptyMessage: string;
  /** Localizes an item's type badge. Required, no default. */
  typeLabel: (type: ArtifactType) => string;
  /** Formats the visible item count, e.g. (n) => `${n} artifacts`. Required, no default. */
  countLabel: (n: number) => string;
  /** Forwarded verbatim to MosaicArtifactCanvasAdapter. */
  adapterLabels: MosaicArtifactCanvasAdapterLabels;
  className?: string;
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

export function MosaicArtifactLibrary({
  items,
  selectedId,
  onSelect,
  source,
  isCanvasOpen,
  onToggleCanvas,
  onCloseCanvas,
  title,
  searchPlaceholder,
  emptyMessage,
  typeLabel,
  countLabel,
  adapterLabels,
  className,
}: MosaicArtifactLibraryProps) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div data-slot="artifact-library" className={cn("flex h-full flex-col", className)}>
      <div className="border-border border-b px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">{title}</h2>
          <span className="text-muted-foreground text-xs">{countLabel(filtered.length)}</span>
        </div>

        <div className="relative">
          <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
            <SearchIcon />
          </span>
          <input
            type="search"
            data-slot="artifact-library-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full rounded-md border border-input bg-background py-2 pr-3 pl-9",
              "text-sm placeholder:text-muted-foreground",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
            )}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-muted-foreground text-sm">{emptyMessage}</p>
        )}

        <ul data-slot="artifact-library-list" className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-slot="artifact-library-item"
                aria-current={selectedId === item.id ? "true" : undefined}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-md border border-border px-3 py-2 text-left",
                  "outline-none transition-colors hover:bg-muted",
                  "focus-visible:ring-[3px] focus-visible:ring-ring",
                  selectedId === item.id && "border-primary bg-primary/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{item.title}</p>
                  <p className="mt-1 text-muted-foreground text-xs">{item.updatedAtLabel}</p>
                </div>
                <span
                  data-slot="artifact-library-item-type"
                  className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
                >
                  {typeLabel(item.type)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div data-slot="artifact-library-canvas" className="border-border border-t p-4">
        <MosaicArtifactCanvasAdapter
          source={source}
          isOpen={isCanvasOpen}
          onToggle={onToggleCanvas}
          onClose={onCloseCanvas}
          labels={adapterLabels}
        />
      </div>
    </div>
  );
}

MosaicArtifactLibrary.displayName = "MosaicArtifactLibrary";
