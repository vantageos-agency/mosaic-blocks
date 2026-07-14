/**
 * MosaicMemorySearch — search bar over a host-supplied knowledge base: a
 * query input, optional filter chips (by type/tag), a clear action, and a
 * result-count indication.
 *
 * Fully controlled, presentational atom: `query` + `onQueryChange` own the
 * text; the component never searches anything itself. It has no idea what
 * "type" or "tag" means — the entire filter catalogue (`filters`) is
 * host-supplied DATA, exactly like `MosaicTemplateCategoryChips`. A client
 * with a different taxonomy (legal, healthcare, e-commerce) supplies its own
 * filter list without touching this package.
 *
 * The result count is never assembled by this component: `resultCount` is a
 * number, and `formatResultCount` is a host-supplied function that turns it
 * into a localized, pluralized string (e.g. `(n) => n === 1 ? "1 result" :
 * \`${n} results\`` or the FR equivalent). Pluralisation is a language; this
 * library speaks none (SIN-01).
 *
 * The clear action only appears once `query` is non-empty — that switch is
 * genuinely presentation state, not a missing word, so `clearButtonLabel`
 * remains a required prop with no default (the host always supplies it, the
 * button simply isn't rendered until there is something to clear).
 *
 * `filters` / `selectedFilterIds` / `onFilterToggle` are optional as a GROUP:
 * a host that has no filter feature at all renders the search bar with none
 * of the three, and no filter chip row is rendered. That optionality encodes
 * the absence of the whole filter FEATURE, not a missing word — every label
 * that IS rendered (each `filter.label`) is still host-owned data, required
 * on the filter object itself.
 *
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --primary, --primary-foreground, --background, --foreground,
 * --border, --muted, --muted-foreground, --input, --ring.
 * a11y: the query input is `type="search"` with an explicit `aria-label`
 * (`searchLabel`, host-owned — no host is forced to also render a visible
 * `<label>`). Each filter chip is a real `<button>` with `aria-pressed` so
 * the selection state reaches screen-reader users without relying on color.
 * The clear button carries its own required `aria-label` for the same
 * reason.
 *
 * Deps: @base-ui/react (via MosaicInput) + class-variance-authority only.
 *
 * @example
 * <MosaicMemorySearch
 *   query={query}
 *   onQueryChange={setQuery}
 *   searchLabel="Search knowledge base"
 *   searchPlaceholder="Search…"
 *   clearButtonLabel="Clear search"
 *   resultCount={results.length}
 *   formatResultCount={(n) => (n === 1 ? "1 result" : `${n} results`)}
 *   filters={[
 *     { id: "type-note", label: "Note" },
 *     { id: "type-decision", label: "Decision" },
 *   ]}
 *   selectedFilterIds={selectedFilterIds}
 *   onFilterToggle={toggleFilter}
 * />
 */

import type * as React from "react";
import { MosaicInput } from "../input/MosaicInput.js";
import { memorySearchFilterChipVariants } from "./memory-search-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * One selectable filter (type, tag, or any other host-defined facet). The
 * library knows nothing about any filter by name — the whole catalogue is
 * host-supplied DATA.
 */
export interface MosaicMemorySearchFilter {
  /** Stable identifier, matched against `selectedFilterIds` and passed to `onFilterToggle`. */
  id: string;
  /** Host-supplied, host-localized display label. No built-in taxonomy. */
  label: string;
}

export interface MosaicMemorySearchProps {
  /** Current query text. Controlled by the host. */
  query: string;
  /** Called with the new query text on every keystroke. */
  onQueryChange: (query: string) => void;
  /** aria-label for the query input. Required, no default. */
  searchLabel: string;
  /** Placeholder for the query input. Required, no default. */
  searchPlaceholder: string;
  /** aria-label for the clear button. Required, no default — rendered only once `query` is non-empty. */
  clearButtonLabel: string;
  /** Total number of results for the current query/filters. Pure data — never computed here. */
  resultCount: number;
  /**
   * Derives the displayed result-count string from `resultCount`. Required —
   * the host owns pluralisation and language, this component never
   * assembles a count string itself.
   */
  formatResultCount: (count: number) => string;
  /**
   * Full open catalogue of filters — a PROP, never a library constant. Omit
   * entirely (with `selectedFilterIds` and `onFilterToggle`) when the host
   * has no filter feature; no filter chip row is then rendered.
   */
  filters?: MosaicMemorySearchFilter[];
  /** Ids of the currently selected filters. Controlled by the host. */
  selectedFilterIds?: string[];
  /** Called with the filter id when a chip is activated. */
  onFilterToggle?: (id: string) => void;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
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

function ClearIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMemorySearch — production search bar for @vantageos/mosaic-blocks.
 *
 * Purely presentational + controlled: renders the query input, an optional
 * host-supplied filter-chip row, a clear action, and a host-formatted
 * result-count string. No network call, no internal query state, no
 * hardcoded filter catalogue.
 */
export function MosaicMemorySearch({
  query,
  onQueryChange,
  searchLabel,
  searchPlaceholder,
  clearButtonLabel,
  resultCount,
  formatResultCount,
  filters,
  selectedFilterIds,
  onFilterToggle,
  className,
  ref,
}: MosaicMemorySearchProps) {
  return (
    <div ref={ref} data-slot="memory-search" className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <SearchIcon />
        </span>
        <MosaicInput
          type="search"
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onQueryChange(event.target.value)
          }
          className="pl-9 pr-9"
        />
        {query.length > 0 && (
          <button
            type="button"
            aria-label={clearButtonLabel}
            onClick={() => onQueryChange("")}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "flex size-5 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-[3px]",
            )}
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {filters && filters.length > 0 && (
        <div data-slot="memory-search-filters" className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const isSelected = (selectedFilterIds ?? []).includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                data-slot="memory-search-filter-chip"
                aria-pressed={isSelected}
                onClick={() => onFilterToggle?.(filter.id)}
                className={memorySearchFilterChipVariants({ selected: isSelected })}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      <p data-slot="memory-search-result-count" className="text-sm text-muted-foreground">
        {formatResultCount(resultCount)}
      </p>
    </div>
  );
}

MosaicMemorySearch.displayName = "MosaicMemorySearch";
