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
import { useLayoutEffect, useRef, useState } from "react";
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

// ── Types ─────────────────────────────────────────────────────────────────────

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
}: MosaicChatThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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
      className={cn(chatThreadRootVariants(), className)}
    >
      <div data-slot="chat-thread-content" className={chatThreadContentVariants()}>
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
