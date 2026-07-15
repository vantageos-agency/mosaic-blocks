/**
 * MosaicThreadIndicator — signals a thread has UNREAD replies
 *
 * Presentational atom. Without it a thread with new agent replies is
 * invisible from the surrounding flow — this renders the trigger that makes
 * that state legible and clickable.
 *
 * The unread count is NEVER typed by the library: it is DERIVED, on every
 * render, from the host-supplied `replies` array (`replies.filter((r) =>
 * r.unread).length`). Mutating the array mutates what is shown — the
 * component holds no count state of its own. When the derived count is zero
 * (including an empty `replies` array), the count pill does not render at
 * all: that is a named absence-of-state, not a library-authored "0" or word.
 *
 * Pattern: MosaicReplyInput.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --accent, --accent-foreground, --ring, --primary,
 * --primary-foreground.
 * a11y: the trigger is a native `<button>`; its accessible name is computed
 * by the host-supplied `ariaLabel(count)` from the same derived count shown
 * visually — assistive technology and sighted users read the same number.
 * Bilingual: `label` and `ariaLabel` are required caller-supplied props —
 * zero hardcoded copy, zero default. The library owns no word for "unread",
 * "replies", or the zero-state; the host's `ariaLabel` formatter carries all
 * of that wording.
 *
 * @example
 * <MosaicThreadIndicator
 *   replies={thread.replies}
 *   label="Thread"
 *   ariaLabel={(count) => `Thread, ${count} unread replies`}
 *   onActivate={() => openThread(thread.id)}
 * />
 */

import type * as React from "react";
import {
  threadIndicatorCountVariants,
  threadIndicatorRootVariants,
} from "./thread-indicator-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Minimal host-supplied reply-status shape the unread count is derived from. */
export type MosaicThreadIndicatorReplyStatus = {
  /** Stable identity for the reply. */
  id: string;
  /** Whether this specific reply is unread, per the host's own state. */
  unread: boolean;
};

export type MosaicThreadIndicatorProps = {
  /**
   * Host-supplied replies for this thread. The rendered unread count is
   * DERIVED from this array (`replies.filter((r) => r.unread).length`) —
   * the library never receives or stores a pre-computed count.
   */
  replies: MosaicThreadIndicatorReplyStatus[];
  /** Visible label for the trigger (e.g. "Thread"). Required, no default. */
  label: string;
  /**
   * Accessible-name formatter, called with the derived unread count.
   * Required — the host owns pluralization/wording, the library owns none.
   */
  ariaLabel: (unreadCount: number) => string;
  /** Called when the trigger is activated (click). */
  onActivate: () => void;
  /** Disables the trigger (e.g. host-level connectivity loss). */
  disabled?: boolean;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLButtonElement>;
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicThreadIndicator — production unread-thread-indicator atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: derives an unread count from host-supplied data and
 * renders a labelled, clickable trigger. No network call, no stored count.
 */
export function MosaicThreadIndicator(props: MosaicThreadIndicatorProps) {
  const { replies, label, ariaLabel, onActivate, disabled = false, className, ref } = props;

  const unreadCount = replies.filter((reply) => reply.unread).length;

  return (
    <button
      ref={ref}
      data-slot="thread-indicator"
      type="button"
      aria-label={ariaLabel(unreadCount)}
      className={cn(threadIndicatorRootVariants(), className)}
      disabled={disabled}
      onClick={onActivate}
    >
      <span data-slot="thread-indicator-label">{label}</span>
      {unreadCount > 0 && (
        <span
          data-slot="thread-indicator-count"
          data-testid="thread-indicator-count"
          className={threadIndicatorCountVariants()}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
}

MosaicThreadIndicator.displayName = "MosaicThreadIndicator";
