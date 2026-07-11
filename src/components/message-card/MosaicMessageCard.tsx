"use client";

/**
 * MosaicMessageCard — generic message/chat card
 *
 * Ported from components/messages/message-card.tsx
 *
 * Features:
 * - Sender avatar (initials fallback) + name + type badge
 * - Message content + relative timestamp
 * - Like/dislike reactions, reply count, bookmark, copy, reply actions
 * - Compact mode
 *
 * Stripped: ChatMessage type from lib/chat/types, sonner toast, formatRelativeTime util.
 * Reactions managed as uncontrolled local state (callbacks still fire).
 */

import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function relativeTime(ts: string | number | Date): string {
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicMessageSenderType = "user" | "ai" | "system";

export interface MosaicMessageSender {
  id: string;
  name: string;
  type: MosaicMessageSenderType;
  avatarUrl?: string;
  /** Tailwind bg class for the avatar (e.g. "bg-green-500") */
  accentColor?: string;
}

export interface MosaicMessageReactions {
  likes?: number;
  dislikes?: number;
}

export interface MosaicMessage {
  id: string;
  content: string;
  sender: MosaicMessageSender;
  timestamp: string | number | Date;
  reactions?: MosaicMessageReactions;
  replyCount?: number;
  parentMessageId?: string;
  bookmarked?: boolean;
}

export interface MosaicMessageCardProps {
  message: MosaicMessage;
  onReply?: (messageId: string) => void;
  onReaction?: (messageId: string, type: "like" | "dislike") => void;
  onBookmark?: (messageId: string) => void;
  onCopy?: (messageId: string, content: string) => void;
  showThread?: boolean;
  compact?: boolean;
  /** Label for the reply button. Required — host-owned, no default. */
  replyLabel: string;
  /** aria-label for the more-options menu trigger. Required — host-owned, no default. */
  moreOptionsAriaLabel: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

const icons = {
  user: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bot: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  thumbUp: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  thumbDown: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  ),
  reply: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  bookmark: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  copy: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  msgSquare: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  more: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  ),
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicMessageCard({
  message,
  onReply,
  onReaction,
  onBookmark,
  onCopy,
  showThread = true,
  compact = false,
  replyLabel,
  moreOptionsAriaLabel,
  className,
}: MosaicMessageCardProps) {
  const [bookmarked, setBookmarked] = React.useState(message.bookmarked ?? false);
  const [likes, setLikes] = React.useState(message.reactions?.likes ?? 0);
  const [dislikes, setDislikes] = React.useState(message.reactions?.dislikes ?? 0);
  const [hasLiked, setHasLiked] = React.useState(false);
  const [hasDisliked, setHasDisliked] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const initials = message.sender.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
      setHasLiked(false);
    } else {
      setLikes(likes + 1);
      setHasLiked(true);
      if (hasDisliked) {
        setDislikes(dislikes - 1);
        setHasDisliked(false);
      }
    }
    onReaction?.(message.id, "like");
  };

  const handleDislike = () => {
    if (hasDisliked) {
      setDislikes(dislikes - 1);
      setHasDisliked(false);
    } else {
      setDislikes(dislikes + 1);
      setHasDisliked(true);
      if (hasLiked) {
        setLikes(likes - 1);
        setHasLiked(false);
      }
    }
    onReaction?.(message.id, "dislike");
  };

  const handleBookmark = () => {
    setBookmarked((b) => !b);
    onBookmark?.(message.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => null);
    onCopy?.(message.id, message.content);
  };

  React.useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  return (
    <div
      data-slot="message-card"
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        compact && "p-3",
        message.sender.type === "user" && "bg-primary/5",
        className,
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full text-white font-semibold",
            compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
            message.sender.accentColor ?? "bg-muted text-muted-foreground",
          )}
        >
          {message.sender.avatarUrl ? (
            <img
              src={message.sender.avatarUrl}
              alt={message.sender.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : message.sender.type === "user" ? (
            initials || icons.user
          ) : (
            icons.bot
          )}
        </span>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("font-medium", compact ? "text-sm" : "text-base")}>
                {message.sender.name}
              </span>
              {message.sender.type === "ai" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  AI
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(message.timestamp)}
            </span>
          </div>

          {/* Content */}
          <p
            className={cn(
              "leading-relaxed text-foreground mb-3",
              compact ? "text-sm" : "text-base",
            )}
          >
            {message.content}
          </p>

          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {message.sender.type === "ai" && (
                <>
                  <button
                    type="button"
                    onClick={handleLike}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      hasLiked && "text-primary",
                    )}
                    aria-label={`Like (${likes})`}
                  >
                    {icons.thumbUp}
                    <span>{likes}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDislike}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      hasDisliked && "text-destructive",
                    )}
                    aria-label={`Dislike (${dislikes})`}
                  >
                    {icons.thumbDown}
                    <span>{dislikes}</span>
                  </button>
                </>
              )}
              {showThread && (message.replyCount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => onReply?.(message.id)}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {icons.msgSquare}
                  <span>{message.replyCount}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onReply?.(message.id)}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {icons.reply}
                <span>{replyLabel}</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleBookmark}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  bookmarked && "text-primary",
                )}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark message"}
                aria-pressed={bookmarked}
              >
                {icons.bookmark}
              </button>

              {/* More menu */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label={moreOptionsAriaLabel}
                  aria-haspopup="menu"
                >
                  {icons.more}
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-popover py-1 shadow-md"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleCopy();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {icons.copy}
                      Copy message
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onReply?.(message.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {icons.reply}
                      Reply
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleBookmark();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {icons.bookmark}
                      {bookmarked ? "Remove bookmark" : "Bookmark"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {message.parentMessageId && showThread && (
            <div className="mt-2 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => onReply?.(message.id)}
                className="inline-flex h-7 items-center gap-1 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground px-2"
              >
                {icons.msgSquare}
                View thread
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

MosaicMessageCard.displayName = "MosaicMessageCard";
