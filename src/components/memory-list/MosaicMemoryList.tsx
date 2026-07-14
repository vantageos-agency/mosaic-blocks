/**
 * MosaicMemoryList — presentational, row-disposition-only list of host items
 *
 * The row presentation of a knowledge base: a single-column stack of
 * divided rows, one per entry. `MosaicMemoryGrid` is its tile-disposition
 * sibling — both take the SAME `items` + `renderItem` + `emptyMessage`
 * contract and differ ONLY in the container's Tailwind layout classes
 * (`memory-list-variants.ts` vs. `memory-grid-variants.ts`).
 *
 * The list owns disposition ONLY:
 * - `items`: the host's array of entries, each requiring only an `id`.
 * - `renderItem`: the host-supplied per-entry renderer — the list never
 *   renders a row of its own and never hardcodes a field, a category, a
 *   sort order, or any domain content (no-hardcoded-business-knowledge).
 * - `emptyMessage`: required, no default (SIN-01) — the host owns the
 *   language, e.g. `t('MemoryList.empty')`.
 *
 * Keyboard: roving tabindex across items (native `<ul>` / `<li>` — semantic
 * list roles come from the elements themselves, no explicit `role` needed)
 * — ArrowDown/ArrowRight moves focus to the next row, ArrowUp/ArrowLeft to
 * the previous, Home/End jump to the first/last. Exactly one item is
 * `tabIndex={0}` at a time; the rest are `tabIndex={-1}`.
 */

import type * as React from "react";
import { useRef, useState } from "react";
import { memoryListItemVariants, memoryListVariants } from "./memory-list-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMemoryListProps<T extends { id: string }> {
  /** The entries to lay out as rows. The list never inspects their shape beyond `id`. */
  items: T[];
  /** Host-owned renderer for a single entry — the list owns disposition only. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Row density: "comfortable" (default) or "compact". Changes row padding only. */
  density?: "comfortable" | "compact";
  /**
   * Message shown when `items` is empty. Required, no default — the host
   * owns the language (e.g. `t('MemoryList.empty')`).
   */
  emptyMessage: string;
  /** Additional Tailwind classes on the root container. */
  className?: string;
  /** Additional Tailwind classes on each row wrapper. */
  itemClassName?: string;
  /** React 19 ref prop — forwarded to the root container. */
  ref?: React.Ref<HTMLDivElement | HTMLUListElement>;
}

// ── Keyboard navigation ───────────────────────────────────────────────────────

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMemoryList — production row-disposition atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: no filtering, no sorting, no item rendering — the
 * host owns the entry content via `renderItem`; this component only owns
 * the row list layout and keyboard roving-tabindex navigation.
 */
export function MosaicMemoryList<T extends { id: string }>({
  items,
  renderItem,
  density = "comfortable",
  emptyMessage,
  className,
  itemClassName,
  ref,
}: MosaicMemoryListProps<T>) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  function focusItem(index: number) {
    if (items.length === 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setFocusedIndex(clamped);
    itemRefs.current[clamped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLLIElement>, index: number) {
    if (NEXT_KEYS.has(event.key)) {
      event.preventDefault();
      focusItem(index + 1);
    } else if (PREV_KEYS.has(event.key)) {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(items.length - 1);
    }
  }

  if (items.length === 0) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement> | undefined}
        data-slot="memory-list"
        className={cn(memoryListVariants({ density }), className)}
      >
        <p
          data-slot="memory-list-empty"
          className="py-12 text-center text-sm text-muted-foreground"
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <ul
      ref={ref as React.Ref<HTMLUListElement> | undefined}
      data-slot="memory-list"
      className={cn("list-none", memoryListVariants({ density }), className)}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          data-slot="memory-list-item"
          tabIndex={index === focusedIndex ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onFocus={() => setFocusedIndex(index)}
          className={cn(memoryListItemVariants({ density }), itemClassName)}
        >
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

MosaicMemoryList.displayName = "MosaicMemoryList";
