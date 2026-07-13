/**
 * MosaicChatSidebar — presentational, disposition-only column of
 * conversation threads.
 *
 * Same shape as `MosaicTemplateList`: a scrollable list over host-supplied
 * items, rendered entirely through a host-supplied `renderThread` — the
 * sidebar never invents a thread title, timestamp, preview snippet, or any
 * other domain content. It owns exactly three things: the scrollable
 * container, a roving-tabindex keyboard-navigable list, and the
 * active/inactive visual state of each row (driven by the host-controlled
 * `activeThreadId` prop, never internal state the component invents).
 *
 * Selecting a thread (`onSelectThread`) and starting a new one
 * (`onNewThread`) are callbacks up — the sidebar never mutates the thread
 * list itself.
 *
 * Empty state: the host owns the empty message (`emptyMessage`, required,
 * no default — SIN-01) — never an invented English fallback and never a
 * silent blank.
 *
 * Keyboard: roving tabindex down the list (native `<ul>` / `<li>` — semantic
 * list roles come from the elements themselves) — ArrowDown moves focus to
 * the next thread, ArrowUp to the previous, Home/End jump to the
 * first/last. Exactly one row is `tabIndex={0}` at a time.
 *
 * Deps: class-variance-authority only.
 */

import type * as React from "react";
import { useRef, useState } from "react";
import { chatSidebarThreadVariants } from "./chat-sidebar-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicChatSidebarProps<T extends { id: string }> {
  /** The threads to lay out. The sidebar never inspects their shape beyond `id`. */
  threads: T[];
  /** Host-owned renderer for a single thread — the sidebar owns disposition only. */
  renderThread: (thread: T, index: number) => React.ReactNode;
  /**
   * The currently-active thread id, or `null` when no thread is selected.
   * Host-controlled — the sidebar never invents its own notion of "active".
   */
  activeThreadId: string | null;
  /** Called with the thread id when a row is selected (click or Enter/Space). */
  onSelectThread: (id: string) => void;
  /** Called when the "new thread" action is triggered. */
  onNewThread: () => void;
  /** Label for the "new thread" action. Required, no default. */
  newThreadLabel: string;
  /**
   * Message shown when `threads` is empty. Required, no default — the host
   * owns the language (e.g. `t('ChatSidebar.empty')`).
   */
  emptyMessage: string;
  /** Additional Tailwind classes on the root container. */
  className?: string;
  /** Additional Tailwind classes on each thread row wrapper. */
  itemClassName?: string;
  /** React 19 ref prop — forwarded to the root container. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Keyboard navigation ───────────────────────────────────────────────────────

const NEXT_KEYS = new Set(["ArrowDown"]);
const PREV_KEYS = new Set(["ArrowUp"]);
const SELECT_KEYS = new Set(["Enter", " "]);

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicChatSidebar — production disposition-only conversation-thread
 * column for @vantageos/mosaic-blocks.
 *
 * Purely presentational: no thread fetching, no sorting, no row content —
 * the host owns row content via `renderThread`; this component only owns
 * the scrollable disposition, keyboard roving-tabindex navigation, and the
 * active-row highlight driven by `activeThreadId`.
 *
 * @example
 * <MosaicChatSidebar
 *   threads={threads}
 *   activeThreadId={currentId}
 *   onSelectThread={(id) => setCurrentId(id)}
 *   onNewThread={() => createThread()}
 *   newThreadLabel="New conversation"
 *   emptyMessage="No conversations yet."
 *   renderThread={(thread) => <span>{thread.title}</span>}
 * />
 */
export function MosaicChatSidebar<T extends { id: string }>({
  threads,
  renderThread,
  activeThreadId,
  onSelectThread,
  onNewThread,
  newThreadLabel,
  emptyMessage,
  className,
  itemClassName,
  ref,
}: MosaicChatSidebarProps<T>) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  function focusItem(index: number) {
    if (threads.length === 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(threads.length - 1, index));
    setFocusedIndex(clamped);
    itemRefs.current[clamped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLLIElement>, index: number, id: string) {
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
      focusItem(threads.length - 1);
    } else if (SELECT_KEYS.has(event.key)) {
      event.preventDefault();
      onSelectThread(id);
    }
  }

  return (
    <div
      ref={ref}
      data-slot="chat-sidebar"
      className={cn("flex h-full flex-col gap-2 overflow-y-auto", className)}
    >
      <button
        type="button"
        data-slot="chat-sidebar-new-thread"
        onClick={onNewThread}
        className="w-full rounded-md border border-border px-3 py-2 text-left text-foreground text-sm hover:bg-muted"
      >
        {newThreadLabel}
      </button>

      {threads.length === 0 ? (
        <p
          data-slot="chat-sidebar-empty"
          className="py-8 text-center text-muted-foreground text-sm"
        >
          {emptyMessage}
        </p>
      ) : (
        <ul data-slot="chat-sidebar-list" className="list-none">
          {threads.map((thread, index) => {
            const isActive = activeThreadId === thread.id;
            return (
              <li
                key={thread.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                data-slot="chat-sidebar-thread"
                data-active={isActive}
                tabIndex={index === focusedIndex ? 0 : -1}
                onKeyDown={(event) => handleKeyDown(event, index, thread.id)}
                onFocus={() => setFocusedIndex(index)}
                onClick={() => onSelectThread(thread.id)}
                className={cn(chatSidebarThreadVariants({ active: isActive }), itemClassName)}
              >
                {renderThread(thread, index)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

MosaicChatSidebar.displayName = "MosaicChatSidebar";
