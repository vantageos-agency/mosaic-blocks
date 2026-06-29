"use client";

/**
 * MosaicActivityFeed — stagger-reveal activity list with status badges (PC-08)
 *
 * Ported (source: private upstream) components/dashboard/RecentActivity.tsx
 *
 * Feed card with stagger-reveal rows. Each row (MosaicActivityItem):
 * - icon slot (caller-provided ReactNode)
 * - title, description
 * - participant avatar stack (initials fallback)
 * - message count
 * - status badge (active / completed / archived + accent colors)
 * - timestamp
 *
 * Generalized: hardcoded debate mock data stripped; externalized as activities[].
 * "View All" link slot via viewAllHref prop + optional renderLink.
 *
 * Framer-motion replaced with CSS stagger (precedent: MosaicAnimatedList).
 * Respects prefers-reduced-motion.
 * Icons: inline SVG (no lucide dep).
 */

import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-activity-feed-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-activity-in {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .mosaic-activity-row {
      opacity: 0;
      animation: mosaic-activity-in 300ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-activity-row {
        animation: none !important;
        opacity: 1 !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicActivityStatus = "active" | "completed" | "archived";

/**
 * Participant shape.
 *
 * Two forms accepted (union, both backward-compat):
 * - `string` — plain label, rendered as initials avatar (original API)
 * - `{ actor?: string; excerpt?: string }` — structured form (VP ActivityEvent shape)
 *   `actor` is used as the avatar label; `excerpt` is surfaced as a sub-line when rendering.
 */
export type MosaicActivityParticipant = string | { actor?: string; excerpt?: string };

export interface MosaicActivity {
  /** Stable unique identifier */
  id: string;
  /** Activity category string (used to pick icon if iconMap provided) */
  type: string;
  title: string;
  description?: string;
  /**
   * Timestamp label. Accepts:
   * - `string` — display-ready label or ISO string (original API)
   * - `number` — Unix ms epoch (VP `updatedAt` numeric form)
   */
  timestamp: string | number;
  /**
   * Activity status. Accepts the canonical `MosaicActivityStatus` values
   * (`"active" | "completed" | "archived"`) OR any free string from upstream
   * systems (e.g. VP `ActivityEvent.status`). Known values receive accent styling;
   * unknown strings fall back to the "archived" (neutral) style.
   *
   * Using `MosaicActivityStatus | (string & {})` preserves IDE autocomplete
   * for the well-known values while accepting arbitrary strings at runtime.
   */
  status: MosaicActivityStatus | (string & {});
  /**
   * Participant list. Accepts:
   * - `string[]` — plain labels rendered as initials avatars (original API)
   * - `MosaicActivityParticipant[]` — union shape also accepting `{ actor?, excerpt? }` objects
   */
  participants?: MosaicActivityParticipant[];
  /** Number of messages/events in this activity */
  messages?: number;
  /**
   * Optional excerpt / summary text (VP ActivityEvent field).
   * Shown below description when present.
   */
  excerpt?: string;
}

export interface MosaicActivityFeedProps {
  activities: MosaicActivity[];
  /** Section heading */
  heading?: string;
  /** Href for "View All" link */
  viewAllHref?: string;
  /**
   * Map of activity.type → icon ReactNode.
   * Default: generic clock icon for all types.
   */
  iconMap?: Record<string, React.ReactNode>;
  /**
   * Custom link renderer (e.g. Next.js Link).
   * Default: native <a>.
   */
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Status colors ─────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400",
  completed: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400",
  archived: "bg-gray-500/10 text-gray-600 border border-gray-500/20 dark:text-gray-400",
};

/** Fallback style for unrecognised status strings */
const STATUS_FALLBACK = "bg-gray-500/10 text-gray-600 border border-gray-500/20 dark:text-gray-400";

/** Resolve status display class — known values get accent colours, others neutral. */
function getStatusClass(status: string): string {
  return STATUS_CLASSES[status] ?? STATUS_FALLBACK;
}

/** Normalise a participant (string or structured object) to a display label. */
function participantLabel(p: MosaicActivityParticipant): string {
  if (typeof p === "string") return p;
  return p.actor ?? "";
}

/**
 * Normalise timestamp to a display string.
 * Numeric values are treated as Unix ms and formatted as a locale date-time.
 */
function formatTimestamp(ts: string | number): string {
  if (typeof ts === "string") return ts;
  return new Date(ts).toLocaleString();
}

// ── Default icon ──────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── MosaicActivityItem (exported standalone) ──────────────────────────────────

export interface MosaicActivityItemProps {
  activity: MosaicActivity;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * MosaicActivityItem — single row in the activity feed.
 * Can be used standalone outside MosaicActivityFeed.
 */
export function MosaicActivityItem({ activity, icon, className }: MosaicActivityItemProps) {
  return (
    <div
      data-slot="activity-item"
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50",
        className,
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon ?? <ClockIcon />}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium text-foreground">{activity.title}</h4>
            {activity.description && (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                {activity.description}
              </p>
            )}

            {/* Participant avatars */}
            {activity.participants && activity.participants.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {activity.participants.slice(0, 3).map((p) => {
                    const label = participantLabel(p);
                    return (
                      <div
                        key={label}
                        aria-label={label}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground"
                      >
                        {label.slice(0, 2).toUpperCase()}
                      </div>
                    );
                  })}
                </div>
                {activity.messages !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {activity.messages} messages
                  </span>
                )}
              </div>
            )}
            {/* Excerpt (VP ActivityEvent field) */}
            {activity.excerpt && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {activity.excerpt}
              </p>
            )}
          </div>

          {/* Status + timestamp */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                getStatusClass(activity.status),
              )}
            >
              {activity.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

MosaicActivityItem.displayName = "MosaicActivityItem";

// ── MosaicActivityFeed ────────────────────────────────────────────────────────

/**
 * MosaicActivityFeed — scrollable card listing recent activities with stagger reveal.
 *
 * @example
 * <MosaicActivityFeed
 *   heading="Recent Activity"
 *   viewAllHref="/history"
 *   activities={[
 *     { id: "1", type: "task", title: "Published report", description: "PDF export", timestamp: "2h ago", status: "completed" },
 *   ]}
 * />
 */
export function MosaicActivityFeed({
  activities,
  heading = "Recent Activity",
  viewAllHref,
  iconMap,
  renderLink,
  className,
  ref,
}: MosaicActivityFeedProps) {
  React.useEffect(() => {
    injectStyles();
  }, []);

  const defaultRenderLink = (href: string, children: React.ReactNode) => (
    <a
      href={href}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </a>
  );

  const link = renderLink ?? defaultRenderLink;

  return (
    <div
      ref={ref}
      data-slot="activity-feed"
      className={cn("rounded-xl border border-border bg-card", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
        {viewAllHref &&
          link(
            viewAllHref,
            <>
              View All
              <ArrowRightIcon />
            </>,
          )}
      </div>

      {/* Activity rows */}
      <div className="divide-y divide-border p-2">
        {activities.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recent activity</p>
        ) : (
          activities.map((activity, idx) => (
            <div
              key={activity.id}
              className="mosaic-activity-row"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <MosaicActivityItem activity={activity} icon={iconMap?.[activity.type]} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

MosaicActivityFeed.displayName = "MosaicActivityFeed";
