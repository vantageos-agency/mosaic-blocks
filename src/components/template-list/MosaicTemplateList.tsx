/**
 * MosaicTemplateList — presentational, disposition-only list of host items
 *
 * Ported from any-debate-ai's five scattered template-listing variants
 * (components/templates/TemplateGallery.tsx — grid/list toggle,
 * components/templates/template-list.tsx — responsive-pair orchestrator,
 * components/templates/desktop/TemplateListDesktop.tsx,
 * components/templates/mobile/TemplateListMobile.tsx,
 * components/templates/QuickStartPanel.tsx — quick-start responsive-pair).
 *
 * MERGED: the common shape across all five is "a disposition (grid or
 * single-column list) over an array of items, each one rendered as some kind
 * of card, with an empty state when the array is empty". That shape — and
 * ONLY that shape — is what ships here.
 *
 * LEFT BEHIND (host-specific, NOT ported):
 * - Search input, category chips, sort mode, filter sidebar (TemplateGallery,
 *   template-list.tsx): the host composes its own search/filter UI and
 *   passes the ALREADY-FILTERED `items` array in. A list should not own
 *   filtering state.
 * - The two-pane "list + preview" desktop layout (TemplateListDesktop /
 *   TemplatePreviewDesktop): that is a split-pane composition concern
 *   (`MosaicResizableSplitPane` already exists for that), not a list concern.
 * - Any per-card content: title, description, category badge, agent count,
 *   usage count, favorite star, "use template" action (TemplateCard,
 *   TemplateGalleryCard, TemplateCardDesktop, TemplateCardCompact,
 *   AgentTeamPreview, QuickStart scenario/preset cards). The card shape
 *   differs across all five sources and is exactly the kind of business
 *   content a list must NOT hardcode — the host supplies it via
 *   `renderItem`, exactly like `MosaicChatThread` takes message rendering
 *   as `children` rather than rendering `MosaicChatMessage` itself.
 * - framer-motion stagger-in animation (TemplateListDesktop /
 *   TemplateListMobile): decorative entrance motion is a host concern, not
 *   part of the disposition contract.
 * - Mock template data, DebateTemplate / QuickStartScenario / AgentTeamPreset
 *   types: business shapes belong to the consuming app, never to a
 *   library-level UI atom (SIN-01 + no-hardcoded-business-knowledge).
 *
 * Disposition (grid vs. single-column list) is exposed as a `layout` cva
 * variant (`template-list-variants.ts`) — switching it changes ONLY the
 * container's Tailwind classes, never the props contract.
 *
 * Keyboard: roving tabindex across items (native `<ul>` / `<li>` — semantic
 * list roles come from the elements themselves, no explicit `role` needed)
 * — ArrowRight/ArrowDown moves focus to the next item, ArrowLeft/ArrowUp to
 * the previous, Home/End jump to the first/last. Exactly one item is
 * `tabIndex={0}` at a time; the rest are `tabIndex={-1}` — the browser's
 * native Tab key steps over the whole list in one stop, then arrow keys
 * navigate within it.
 *
 * Empty state: the host owns the empty message (`emptyMessage`, required,
 * no default — SIN-01) — never an invented English fallback and never a
 * silent blank.
 */

import type * as React from "react";
import { useRef, useState } from "react";
import { templateListVariants } from "./template-list-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicTemplateListProps<T extends { id: string }> {
  /** The items to lay out. The list never inspects their shape beyond `id`. */
  items: T[];
  /** Host-owned renderer for a single item — the list owns disposition only. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Disposition: grid (responsive columns) or single-column list. Default "grid". */
  layout?: "grid" | "list";
  /**
   * Message shown when `items` is empty. Required, no default — the host
   * owns the language (e.g. `t('TemplateList.empty')`).
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
 * MosaicTemplateList — production disposition-only list atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: no filtering, no sorting, no item rendering — the
 * host owns the item content via `renderItem`; this component only owns the
 * grid/list layout and keyboard roving-tabindex navigation.
 */
export function MosaicTemplateList<T extends { id: string }>({
  items,
  renderItem,
  layout = "grid",
  emptyMessage,
  className,
  itemClassName,
  ref,
}: MosaicTemplateListProps<T>) {
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
        data-slot="template-list"
        className={cn(templateListVariants({ layout }), className)}
      >
        <p
          data-slot="template-list-empty"
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
      data-slot="template-list"
      className={cn("list-none", templateListVariants({ layout }), className)}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          data-slot="template-list-item"
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

MosaicTemplateList.displayName = "MosaicTemplateList";
