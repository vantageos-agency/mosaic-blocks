/**
 * MosaicThreadView — one client request, several agents replying beneath it
 *
 * Presentational atom. Makes agent collaboration readable: renders a single
 * root message, then every host-supplied reply nested beneath it, in
 * document order, inside its own labelled region — distinguishing "the
 * question" from "the agents answering it" for assistive technology and
 * sighted users alike.
 *
 * The root message and every reply's author/content are host-supplied
 * `React.ReactNode`s (`root.author`, `root.content`, `replies[].author`,
 * `replies[].content`): the library never invents sender names, avatars, or
 * message copy. Zero I/O, zero fetch, zero server-side filtering — the
 * thread data is fully host-supplied and host-controlled.
 *
 * Pattern: MosaicReplyInput.tsx (data-slot, inline cn, React 19 ref prop,
 * displayName, JSDoc, pure variants module).
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --border, --card, --muted, --muted-foreground.
 * a11y: the root message and the replies list are each their own labelled
 * region (`rootAriaLabel`, `repliesAriaLabel`), required props with no
 * default, so assistive technology can navigate directly to either.
 * Bilingual: `rootAriaLabel`, `repliesAriaLabel` and `emptyRepliesLabel` are
 * required caller-supplied strings — zero hardcoded copy, zero default. An
 * empty `replies` array is a named, host-worded state (`emptyRepliesLabel`);
 * the library invents no "No replies yet" text of its own.
 *
 * @example
 * <MosaicThreadView
 *   root={{ id: root.id, author: <SenderName sender={root.sender} />, content: <p>{root.text}</p> }}
 *   replies={replies.map((r) => ({
 *     id: r.id,
 *     author: <SenderName sender={r.sender} />,
 *     content: <p>{r.text}</p>,
 *   }))}
 *   rootAriaLabel="Original request"
 *   repliesAriaLabel="Agent replies"
 *   emptyRepliesLabel="No replies yet"
 * />
 */

import type * as React from "react";
import {
  threadViewEmptyVariants,
  threadViewRepliesVariants,
  threadViewReplyVariants,
  threadViewRootMessageVariants,
  threadViewRootVariants,
} from "./thread-view-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Host-supplied message entry — author and content are fully host-owned nodes. */
export type MosaicThreadViewMessage = {
  /** Stable identity for the message (used as list key for replies). */
  id: string;
  /** Host-supplied node rendering the sender (name, avatar, badge, ...). */
  author: React.ReactNode;
  /** Host-supplied node rendering the message body. */
  content: React.ReactNode;
};

export type MosaicThreadViewProps = {
  /** The single client request every reply is nested beneath. */
  root: MosaicThreadViewMessage;
  /** Every agent reply, nested beneath the root, rendered in array order. */
  replies: MosaicThreadViewMessage[];
  /** Accessible name for the root-message region. Required, no default. */
  rootAriaLabel: string;
  /** Accessible name for the nested-replies region. Required, no default. */
  repliesAriaLabel: string;
  /**
   * Host-worded text shown when `replies` is empty. Required — this is a
   * named absence-of-state, and the library carries no fallback word of its
   * own for "no replies yet".
   */
  emptyRepliesLabel: string;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicThreadView — production thread-view atom for @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders one root message and every host-supplied
 * reply nested beneath it inside a distinct labelled region. No network
 * call, no message state, no invented copy.
 */
export function MosaicThreadView(props: MosaicThreadViewProps) {
  const { root, replies, rootAriaLabel, repliesAriaLabel, emptyRepliesLabel, className, ref } =
    props;

  return (
    <div ref={ref} data-slot="thread-view" className={cn(threadViewRootVariants(), className)}>
      <div
        aria-label={rootAriaLabel}
        className={threadViewRootMessageVariants()}
        data-slot="thread-view-root"
      >
        {root.author}
        {root.content}
      </div>
      <div
        aria-label={repliesAriaLabel}
        className={threadViewRepliesVariants()}
        data-slot="thread-view-replies"
      >
        {replies.length === 0 ? (
          <p className={threadViewEmptyVariants()} data-slot="thread-view-empty">
            {emptyRepliesLabel}
          </p>
        ) : (
          replies.map((reply) => (
            <div className={threadViewReplyVariants()} data-slot="thread-view-reply" key={reply.id}>
              {reply.author}
              {reply.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

MosaicThreadView.displayName = "MosaicThreadView";
