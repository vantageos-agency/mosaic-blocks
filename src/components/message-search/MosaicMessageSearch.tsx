/**
 * MosaicMessageSearch — search bar over the messages of a single, already-open
 * conversation: a query input and a clear action, with the matching results
 * rendered entirely by the host.
 *
 * Distinct from `MosaicMemorySearch` (which searches a host-supplied
 * knowledge base): this component searches WITHIN a conversation's message
 * history so an agent (or a human) can recall a past instruction without
 * re-reading the whole thread.
 *
 * Fully controlled, presentational atom: `query` + `onQueryChange` own the
 * text; the component never searches anything, filters anything, counts
 * anything, or performs any network I/O. It has no idea what a "message" or a
 * "match" looks like — the entire results area is a host-owned slot
 * (`resultsSlot`), exactly like `MosaicMemorySearch`'s `filters` catalogue.
 *
 * The clear action only appears once `query` is non-empty — that switch is
 * genuinely presentation state, not a missing word, so `clearButtonLabel`
 * remains a required prop with no default (the host always supplies it, the
 * button simply isn't rendered until there is something to clear).
 *
 * `resultsSlot` and `emptyResultsLabel` are optional as a GROUP, but for two
 * different reasons:
 * - `resultsSlot` omitted encodes "the host has not rendered a results view
 *   yet" (e.g. the query is empty, or results are still being gathered) —
 *   absence of a whole feature, not a missing word.
 * - `emptyResultsLabel` is the one SIN-01 exception: a NAMED, host-worded
 *   zero-results state. It is rendered only when `resultsSlot` is absent, so
 *   the host signals "I searched and found nothing" by supplying this label
 *   without a results node. When both are supplied, `resultsSlot` wins — the
 *   host is trusted to omit `emptyResultsLabel` once it has real results.
 *
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --primary, --primary-foreground, --background, --foreground,
 * --border, --muted, --muted-foreground, --input, --ring.
 * a11y: the query input is `type="search"` with an explicit `aria-label`
 * (`searchLabel`, host-owned — no host is forced to also render a visible
 * `<label>`). The clear button carries its own required `aria-label` for the
 * same reason.
 *
 * Deps: @base-ui/react (via MosaicInput) + class-variance-authority only.
 *
 * @example
 * <MosaicMessageSearch
 *   query={query}
 *   onQueryChange={setQuery}
 *   searchLabel="Search this conversation"
 *   searchPlaceholder="Search messages…"
 *   clearButtonLabel="Clear search"
 *   resultsSlot={matches.length > 0 ? <MatchList matches={matches} /> : undefined}
 *   emptyResultsLabel="No messages match your search"
 * />
 */

import type * as React from "react";
import { MosaicInput } from "../input/MosaicInput.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMessageSearchProps {
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
  /**
   * Host-owned results view for the current query — a node, never data the
   * component would render itself. The host performs the search; this
   * component never sees a single message.
   */
  resultsSlot?: React.ReactNode;
  /**
   * Host-worded zero-results state. Rendered only when `resultsSlot` is
   * absent — the host signals "I searched and found nothing" by supplying
   * this label without a results node. Absence (with `resultsSlot` also
   * absent) encodes a neutral state (e.g. no search performed yet).
   */
  emptyResultsLabel?: string;
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
 * MosaicMessageSearch — production in-thread message search bar for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational + controlled: renders the query input, a clear
 * action, and whatever host-owned results view is passed in. No network
 * call, no internal query state, no message model of any kind.
 */
export function MosaicMessageSearch({
  query,
  onQueryChange,
  searchLabel,
  searchPlaceholder,
  clearButtonLabel,
  resultsSlot,
  emptyResultsLabel,
  className,
  ref,
}: MosaicMessageSearchProps) {
  return (
    <div ref={ref} data-slot="message-search" className={cn("flex flex-col gap-2", className)}>
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

      {resultsSlot ? (
        <div data-slot="message-search-results">{resultsSlot}</div>
      ) : (
        emptyResultsLabel && (
          <p data-slot="message-search-results" className="text-sm text-muted-foreground">
            {emptyResultsLabel}
          </p>
        )
      )}
    </div>
  );
}

MosaicMessageSearch.displayName = "MosaicMessageSearch";
