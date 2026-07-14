"use client";

/**
 * MosaicMessageList — responsive message list (desktop + mobile responsive-pair)
 *
 * Ported from components/messages/message-list.tsx +
 *   messages/desktop/message-list-desktop.tsx +
 *   messages/mobile/message-list-mobile.tsx
 *
 * Orchestrator reads useDevice → Desktop/Mobile variant.
 * Desktop: scrollable card list with sticky header + search.
 * Mobile: compact card list with sticky "Load more" button.
 *
 * Props-driven — no internal state for messages (fully controlled).
 * sonner toast removed.
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";
import { type MosaicMessage, MosaicMessageCard } from "../message-card/MosaicMessageCard.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMessageListProps {
  messages: MosaicMessage[];
  onReply?: (messageId: string) => void;
  onReaction?: (messageId: string, type: "like" | "dislike") => void;
  onBookmark?: (messageId: string) => void;
  onCopy?: (messageId: string, content: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  /** Optional title for the list header */
  title?: string;
  /** Whether messages are loading */
  isLoading?: boolean;
  /** Placeholder for the desktop search input. Required, no default. */
  searchPlaceholder: string;
  /** Message shown when the filtered list is empty. Required, no default. */
  emptyMessage: string;
  /** Label for the "load more" button. Required, no default. */
  loadMoreLabel: string;
  /** Required host-owned strings forwarded to every MosaicMessageCard. */
  replyLabel: string;
  moreOptionsAriaLabel: string;
  removeBookmarkAriaLabel: string;
  bookmarkAriaLabel: string;
  removeBookmarkLabel: string;
  bookmarkLabel: string;
  copyMessageLabel: string;
  viewThreadLabel: string;
  likeAriaLabel: (count: number) => string;
  dislikeAriaLabel: (count: number) => string;
  className?: string;
}

// ── Search icon ───────────────────────────────────────────────────────────────

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

// ── Desktop variant ───────────────────────────────────────────────────────────

function MessageListDesktop({
  messages,
  onReply,
  onReaction,
  onBookmark,
  onCopy,
  onLoadMore,
  hasMore,
  title,
  isLoading,
  searchPlaceholder,
  emptyMessage,
  loadMoreLabel,
  replyLabel,
  moreOptionsAriaLabel,
  removeBookmarkAriaLabel,
  bookmarkAriaLabel,
  removeBookmarkLabel,
  bookmarkLabel,
  copyMessageLabel,
  viewThreadLabel,
  likeAriaLabel,
  dislikeAriaLabel,
  className,
}: MosaicMessageListProps) {
  const [query, setQuery] = React.useState("");

  const filtered = query
    ? messages.filter(
        (m) =>
          m.content.toLowerCase().includes(query.toLowerCase()) ||
          m.sender.name.toLowerCase().includes(query.toLowerCase()),
      )
    : messages;

  return (
    <div data-slot="message-list-desktop" className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        <div className="relative ml-auto max-w-xs flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}
        {!isLoading &&
          filtered.map((message) => (
            <MosaicMessageCard
              key={message.id}
              message={message}
              onReply={onReply}
              onReaction={onReaction}
              onBookmark={onBookmark}
              onCopy={onCopy}
              replyLabel={replyLabel}
              moreOptionsAriaLabel={moreOptionsAriaLabel}
              removeBookmarkAriaLabel={removeBookmarkAriaLabel}
              bookmarkAriaLabel={bookmarkAriaLabel}
              removeBookmarkLabel={removeBookmarkLabel}
              bookmarkLabel={bookmarkLabel}
              copyMessageLabel={copyMessageLabel}
              viewThreadLabel={viewThreadLabel}
              likeAriaLabel={likeAriaLabel}
              dislikeAriaLabel={dislikeAriaLabel}
            />
          ))}
        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>

      {hasMore && (
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={onLoadMore}
            className={cn(
              "w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mobile variant ────────────────────────────────────────────────────────────

function MessageListMobile({
  messages,
  onReply,
  onReaction,
  onBookmark,
  onCopy,
  onLoadMore,
  hasMore,
  title,
  isLoading,
  emptyMessage,
  loadMoreLabel,
  replyLabel,
  moreOptionsAriaLabel,
  removeBookmarkAriaLabel,
  bookmarkAriaLabel,
  removeBookmarkLabel,
  bookmarkLabel,
  copyMessageLabel,
  viewThreadLabel,
  likeAriaLabel,
  dislikeAriaLabel,
  className,
}: MosaicMessageListProps) {
  return (
    <div data-slot="message-list-mobile" className={cn("flex flex-col", className)}>
      {title && (
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
      )}

      <div className="space-y-3 p-4">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}
        {!isLoading &&
          messages.map((message) => (
            <MosaicMessageCard
              key={message.id}
              message={message}
              onReply={onReply}
              onReaction={onReaction}
              onBookmark={onBookmark}
              onCopy={onCopy}
              replyLabel={replyLabel}
              moreOptionsAriaLabel={moreOptionsAriaLabel}
              removeBookmarkAriaLabel={removeBookmarkAriaLabel}
              bookmarkAriaLabel={bookmarkAriaLabel}
              removeBookmarkLabel={removeBookmarkLabel}
              bookmarkLabel={bookmarkLabel}
              copyMessageLabel={copyMessageLabel}
              viewThreadLabel={viewThreadLabel}
              likeAriaLabel={likeAriaLabel}
              dislikeAriaLabel={dislikeAriaLabel}
              compact
            />
          ))}
        {!isLoading && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>

      {hasMore && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onLoadMore}
            className={cn(
              "w-full min-h-[44px] rounded-md border border-border bg-background px-4 py-2 text-sm font-medium",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export function MosaicMessageList(props: MosaicMessageListProps) {
  const { isMobile } = useDevice();
  return isMobile ? <MessageListMobile {...props} /> : <MessageListDesktop {...props} />;
}

MosaicMessageList.displayName = "MosaicMessageList";

export { MessageListDesktop as MosaicMessageListDesktop };
export { MessageListMobile as MosaicMessageListMobile };
