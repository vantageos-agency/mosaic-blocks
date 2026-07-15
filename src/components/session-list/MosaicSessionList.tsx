/**
 * MosaicSessionList — presentational, layout-disposition-only list of the
 * workstation's in-progress sessions
 *
 * The source implementation shipped as FOUR separate list components
 * ("stack", "grid", "compact", "inline" dispositions). Merged here into
 * ONE variant-driven component — the list does not exist without the
 * card, and it does not exist four times over either: same doctrine as
 * MosaicMemoryList, applied to the `layout` axis instead of `density`.
 *
 * The list owns disposition ONLY:
 * - `items`: the host's array of sessions, each requiring only an `id`.
 * - `renderItem`: the host-supplied per-session renderer (typically a
 *   `MosaicSessionCard`) — the list never renders a row of its own and
 *   never hardcodes a status, a sort order, or any domain content
 *   (no-hardcoded-business-knowledge). It never fetches its own data.
 * - `emptyMessage`: required, no default (SIN-01) — the host owns the
 *   language, e.g. `t('SessionList.empty')`.
 *
 * Keyboard: roving tabindex across items (native `<ul>` / `<li>` —
 * semantic list roles come from the elements themselves) — ArrowDown/
 * ArrowRight moves focus to the next row, ArrowUp/ArrowLeft to the
 * previous, Home/End jump to the first/last. Exactly one item is
 * `tabIndex={0}` at a time; the rest are `tabIndex={-1}`. Behavior is the
 * same across all four `layout` values — only the container/item Tailwind
 * classes differ.
 *
 * Pattern: MosaicMemoryList.tsx (data-slot, inline utility `cn`, roving
 * tabindex, React 19 ref prop, displayName, JSDoc).
 */

import type * as React from "react";
import { useRef, useState } from "react";
import { sessionListItemVariants, sessionListVariants } from "./session-list-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** The four merged source dispositions, as ONE variant prop. */
export type MosaicSessionListLayout = "stack" | "grid" | "compact" | "inline";

export interface MosaicSessionListProps<T extends { id: string }> {
  /** The sessions to lay out. The list never inspects their shape beyond `id`. */
  items: T[];
  /** Host-owned renderer for a single session — the list owns disposition only. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Container disposition — the four merged source variants.
   * @default "stack"
   */
  layout?: MosaicSessionListLayout;
  /**
   * Message shown when `items` is empty. Required, no default — the host
   * owns the language (e.g. `t('SessionList.empty')`).
   */
  emptyMessage: string;
  /** Additional Tailwind classes on the root container. */
  className?: string;
  /** Additional Tailwind classes on each item wrapper. */
  itemClassName?: string;
  /** React 19 ref prop — forwarded to the root container. */
  ref?: React.Ref<HTMLDivElement | HTMLUListElement>;
}

// ── Keyboard navigation ───────────────────────────────────────────────────────

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSessionList — production layout-disposition atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: no filtering, no sorting, no item rendering, no
 * I/O — the host owns the session content via `renderItem`; this
 * component only owns the four merged layout dispositions and keyboard
 * roving-tabindex navigation.
 */
export function MosaicSessionList<T extends { id: string }>({
  items,
  renderItem,
  layout = "stack",
  emptyMessage,
  className,
  itemClassName,
  ref,
}: MosaicSessionListProps<T>) {
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
        data-slot="session-list"
        data-layout={layout}
        className={cn(sessionListVariants({ layout }), className)}
      >
        <p
          data-slot="session-list-empty"
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
      data-slot="session-list"
      data-layout={layout}
      className={cn("list-none", sessionListVariants({ layout }), className)}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          data-slot="session-list-item"
          tabIndex={index === focusedIndex ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onFocus={() => setFocusedIndex(index)}
          className={cn(sessionListItemVariants({ layout }), itemClassName)}
        >
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

MosaicSessionList.displayName = "MosaicSessionList";
