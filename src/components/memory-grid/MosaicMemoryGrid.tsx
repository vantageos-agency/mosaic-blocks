/**
 * MosaicMemoryGrid — presentational, tile-disposition-only grid of host items
 *
 * The tile presentation of a knowledge base: a responsive grid of tiles, one
 * per entry. `MosaicMemoryList` is its row-disposition sibling — both take
 * the SAME `items` + `renderItem` + `emptyMessage` contract and differ ONLY
 * in the container's Tailwind layout classes (`memory-grid-variants.ts` vs.
 * `memory-list-variants.ts`).
 *
 * The grid owns disposition ONLY:
 * - `items`: the host's array of entries, each requiring only an `id`.
 * - `renderItem`: the host-supplied per-entry renderer — the grid never
 *   renders a tile of its own and never hardcodes a field, a category, a
 *   sort order, or any domain content (no-hardcoded-business-knowledge).
 * - `emptyMessage`: required, no default (SIN-01) — the host owns the
 *   language, e.g. `t('MemoryGrid.empty')`.
 *
 * Keyboard: roving tabindex across items (native `<ul>` / `<li>` — semantic
 * list roles come from the elements themselves, no explicit `role` needed)
 * — ArrowRight/ArrowDown moves focus to the next item, ArrowLeft/ArrowUp to
 * the previous, Home/End jump to the first/last. Exactly one item is
 * `tabIndex={0}` at a time; the rest are `tabIndex={-1}`.
 */

import type * as React from "react";
import { useRef, useState } from "react";
import { memoryGridVariants } from "./memory-grid-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMemoryGridProps<T extends { id: string }> {
  /** The entries to lay out as tiles. The grid never inspects their shape beyond `id`. */
  items: T[];
  /** Host-owned renderer for a single entry — the grid owns disposition only. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Tile density: "comfortable" (default) or "compact". Changes gap only. */
  density?: "comfortable" | "compact";
  /**
   * Message shown when `items` is empty. Required, no default — the host
   * owns the language (e.g. `t('MemoryGrid.empty')`).
   */
  emptyMessage: string;
  /** Additional Tailwind classes on the root container. */
  className?: string;
  /** Additional Tailwind classes on each tile wrapper. */
  itemClassName?: string;
  /** React 19 ref prop — forwarded to the root container. */
  ref?: React.Ref<HTMLDivElement | HTMLUListElement>;
}

// ── Keyboard navigation ───────────────────────────────────────────────────────

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMemoryGrid — production tile-disposition atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: no filtering, no sorting, no item rendering — the
 * host owns the entry content via `renderItem`; this component only owns
 * the tile grid layout and keyboard roving-tabindex navigation.
 */
export function MosaicMemoryGrid<T extends { id: string }>({
  items,
  renderItem,
  density = "comfortable",
  emptyMessage,
  className,
  itemClassName,
  ref,
}: MosaicMemoryGridProps<T>) {
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
        data-slot="memory-grid"
        className={cn(memoryGridVariants({ density }), className)}
      >
        <p
          data-slot="memory-grid-empty"
          className="col-span-full py-12 text-center text-sm text-muted-foreground"
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <ul
      ref={ref as React.Ref<HTMLUListElement> | undefined}
      data-slot="memory-grid"
      className={cn("list-none", memoryGridVariants({ density }), className)}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          data-slot="memory-grid-item"
          tabIndex={index === focusedIndex ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onFocus={() => setFocusedIndex(index)}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

MosaicMemoryGrid.displayName = "MosaicMemoryGrid";
