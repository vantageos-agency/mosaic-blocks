/**
 * MosaicChatThread — presentational, auto-scrolling chat message stream
 *
 * Presentational atom. Renders a scrollable `role="log"` region that keeps
 * itself pinned to the bottom as new messages arrive — the standard "chat
 * thread" behaviour — and surfaces a "scroll to bottom" button once the
 * user has scrolled up away from the latest message. It does NOT render
 * chat messages itself: the host composes the actual message list via
 * `children` (developed in parallel as `MosaicChatMessage`). This keeps the
 * thread free of any dependency on a specific message shape.
 *
 * Local behaviour (no network/data involved, pure UI mechanics):
 * - Tracks "is the user at the bottom" via the native `scroll` event,
 *   comparing `scrollHeight - scrollTop - clientHeight` against a small
 *   pixel threshold (near-bottom counts as "at bottom").
 * - When `children` changes (a new message was appended) AND the user was
 *   at the bottom, the container is scrolled to `scrollHeight` again —
 *   the "stick to bottom" auto-anchor.
 * - When the user has scrolled up, new children arriving do NOT force a
 *   scroll — the "scroll to bottom" button appears instead, and clicking
 *   it scrolls back down and re-arms the auto-anchor.
 *
 * Pattern: MosaicUrlScraper.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module). No icon library — uses a
 * plain "↓" glyph, matching the url-scraper convention (no lucide-react
 * runtime dependency).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --card, --foreground, --accent, --ring.
 * a11y: root uses `role="log"` (accessible live region for a message
 * stream) and native scrolling — no focus is trapped or stolen by the
 * auto-scroll; the "scroll to bottom" button carries a required,
 * host-supplied `aria-label`.
 * Bilingual: the only user-facing string, the scroll button's accessible
 * name, is a required prop (`scrollToBottomLabel`) — zero hardcoded copy,
 * zero default.
 *
 * Ported from any-debate-ai components/chat/conversation.tsx (rewritten
 * from scratch — no shared code, no license carried over, and no
 * `use-stick-to-bottom` runtime dependency): dropped the third-party
 * `StickToBottom` primitive and `ChatConversationContent` split (folded
 * into a single content wrapper, this library's presentational atoms don't
 * ship a separate provider/content/button trio when a single component
 * covers the same behaviour with plain scroll math), kept the scrollable
 * `role="log"` region + auto-anchor-to-bottom + "scroll to bottom" button
 * shape.
 *
 * @example
 * <MosaicChatThread scrollToBottomLabel="Revenir au dernier message">
 *   {messages.map((m) => (
 *     <MosaicChatMessage key={m.id} {...m} />
 *   ))}
 * </MosaicChatThread>
 */

import type * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  chatThreadContentVariants,
  chatThreadRootVariants,
  chatThreadScrollButtonVariants,
} from "./chat-thread-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Px distance from the true bottom still counted as "at bottom". */
const BOTTOM_THRESHOLD_PX = 24;

function isNearBottom(element: HTMLDivElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_THRESHOLD_PX;
}

/** Keyboard keys that express manual navigation intent — disengage the anchor. */
const NAVIGATION_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"]);

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Snapshot of which messages are currently in the thread's viewport.
 *
 * Shape mirrors the shadcn `useMessageScrollerVisibility()` convention
 * (`currentAnchorId` / `visibleMessageIds`) so a host migrating from one to
 * the other does not need to remap fields.
 */
export interface MosaicChatThreadVisibleRange {
  /** Ids (DOM `id` attribute) of the direct children currently intersecting the viewport, in DOM order. */
  visibleMessageIds: string[];
  /** Id of the topmost visible child — a stable "you are here" anchor for a future jump-to-message affordance. `null` when nothing is visible. */
  currentAnchorId: string | null;
}

export interface MosaicChatThreadProps {
  /** The host-rendered message list (or any other scrollable content). */
  children: React.ReactNode;
  /**
   * Accessible name for the "scroll to bottom" button, shown only once the
   * user has scrolled away from the latest message. Required, no default —
   * this is host copy, not an English fallback.
   */
  scrollToBottomLabel: string;
  /** Additional Tailwind classes on the root scrollable element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root scrollable element. */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * OPTIONAL. Called whenever the set of visible messages changes, as
   * observed via `IntersectionObserver` on the content wrapper's direct
   * children. `children` stays fully opaque to this component — the only
   * signal read off each child is its DOM `id` attribute, never its content
   * or shape. A child without an `id` is silently excluded from the report
   * (nothing to identify it by), never introspected further.
   *
   * When this prop is omitted, NO `IntersectionObserver` is created — hosts
   * that do not need visible-range tracking pay zero cost for it.
   *
   * Opens the door to a future "jump to message" affordance built on top of
   * `currentAnchorId`.
   */
  onVisibleRangeChange?: (range: MosaicChatThreadVisibleRange) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicChatThread — production auto-scrolling chat thread atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: no data fetching, no message rendering, no
 * conversation state — the host owns the messages and passes them as
 * `children`; this component only owns the scroll mechanics.
 */
export function MosaicChatThread({
  children,
  scrollToBottomLabel,
  className,
  ref,
  onVisibleRangeChange,
}: MosaicChatThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  function setRefs(node: HTMLDivElement | null) {
    containerRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.RefObject<HTMLDivElement | null>).current = node;
    }
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const atBottom = isNearBottom(event.currentTarget);
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }

  function handleScrollToBottomClick() {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }

  /** Disengages the bottom anchor — same effect as the user scrolling up. */
  function disengageBottomAnchor() {
    isAtBottomRef.current = false;
    setIsAtBottom(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (NAVIGATION_KEYS.has(event.key)) {
      disengageBottomAnchor();
    }
  }

  // `selectionchange` only ever fires on `document` (never on a specific
  // element), so this listener must live on `document` and be torn down on
  // unmount. A selection is only meaningful when it (a) is non-empty — a
  // plain click also fires `selectionchange` with an empty selection, and
  // disengaging there would be a false positive breaking stick-to-bottom on
  // the very first click — and (b) falls inside this thread's container.
  useEffect(() => {
    function handleSelectionChange() {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }
      // BOTH endpoints, because the DOM's `Selection` interface defines exactly
      // two node endpoints — `anchorNode` (lib.dom.d.ts:30373) and `focusNode`
      // (:30391) — and a selection needs only ONE of them inside this thread to
      // mean "I am reading this".
      //
      // Checking `anchorNode` alone was a guard that knew one formulation of the
      // thing it guarded: a selection ENTERING the thread (anchored in the pane
      // next door — the split-pane's document viewer — and focused in here)
      // left `anchorNode` outside, so the handler bailed and the anchor never
      // disengaged, while thread text was visibly selected. The mirror case
      // worked, which is what made it invisible: the hole only showed one way.
      //
      // The endpoint list is DERIVED from the API, not remembered. Each endpoint
      // has its own test, and each is proven by its own mutation.
      const { anchorNode, focusNode } = selection;
      const touchesThread =
        (anchorNode !== null && container.contains(anchorNode)) ||
        (focusNode !== null && container.contains(focusNode));
      if (touchesThread) {
        isAtBottomRef.current = false;
        setIsAtBottom(false);
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Reports which direct children of the content wrapper are currently
  // visible, via IntersectionObserver — keyed on each child's DOM `id`.
  // `children` stays opaque: only the `id` attribute is read, never content.
  //
  // No `onVisibleRangeChange` supplied => no observer is ever constructed —
  // hosts that don't need visible-range tracking pay zero cost for it.
  //
  // Re-runs when `children` changes (elements to observe may have changed)
  // or when `onVisibleRangeChange` itself changes. `children` is a deliberate
  // re-run trigger, not a value read inside the effect body (only the DOM
  // children of `contentRef` are read, via the ref) — same pattern as the
  // stick-to-bottom effect below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (!onVisibleRangeChange) {
      return;
    }
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const visibility = new Map<Element, boolean>();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        visibility.set(entry.target, entry.isIntersecting);
      }
      const visibleMessageIds: string[] = [];
      for (const child of Array.from(content.children)) {
        if (child.id && visibility.get(child)) {
          visibleMessageIds.push(child.id);
        }
      }
      onVisibleRangeChange({
        visibleMessageIds,
        currentAnchorId: visibleMessageIds[0] ?? null,
      });
    });

    for (const child of Array.from(content.children)) {
      observer.observe(child);
    }

    return () => {
      observer.disconnect();
    };
  }, [children, onVisibleRangeChange]);

  // `children` is a deliberate re-run trigger (a new message was appended),
  // not a value read inside the effect body — the effect only touches refs.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (element && isAtBottomRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [children]);

  return (
    <div
      ref={setRefs}
      data-slot="chat-thread"
      role="log"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      className={cn(chatThreadRootVariants(), className)}
    >
      <div ref={contentRef} data-slot="chat-thread-content" className={chatThreadContentVariants()}>
        {children}
      </div>
      {!isAtBottom && (
        <button
          type="button"
          data-slot="chat-thread-scroll-button"
          aria-label={scrollToBottomLabel}
          onClick={handleScrollToBottomClick}
          className={chatThreadScrollButtonVariants()}
        >
          <span aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}

MosaicChatThread.displayName = "MosaicChatThread";
