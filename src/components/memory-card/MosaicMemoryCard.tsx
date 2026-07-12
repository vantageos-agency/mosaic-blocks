"use client";

/**
 * MosaicMemoryCard — memory item card (detailed / compact variants)
 *
 * Ported from any-debate-ai's memory-card-desktop.tsx + memory-card-mobile.tsx
 * as ONE component with a `variant` prop, not two components. What actually
 * differed between the two source files:
 * - Layout density: detailed uses a leading icon chip + title/scope-badge
 *   stack + separate content paragraph + tags row + footer with a labelled
 *   usage count; compact folds title + content into one truncated header
 *   row and drops the tags row entirely. Both variants call
 *   `formatUsageCount` for the footer usage count — the caller decides
 *   whether that renders a label or a bare number.
 * - Hover-reveal actions: the 3-dot menu trigger is `opacity-0
 *   group-hover:opacity-100` in detailed (desktop hover affordance), always
 *   visible in compact (no hover on touch).
 * - Scope badge chrome: bordered in detailed, borderless in compact.
 * Everything else (scope colors, source icon, edit/delete menu, time-ago
 * footer) is shared and modeled once.
 *
 * Pattern: MosaicAgentCard.tsx (data-slot, manual dropdown + outside-click
 * close, inline SVG icons, React 19 ref prop, displayName, JSDoc).
 * No "use client" side effects beyond menu state — prepend-use-client.mjs
 * adds the directive to dist regardless.
 * Design tokens: --card, --card-foreground, --border, --muted-foreground,
 * --accent, --accent-foreground, --destructive, --popover, --ring.
 * No icon library — inline SVGs only (no lucide-react dependency in this repo).
 * a11y: dropdown via role="menu"/"menuitem", aria-haspopup, aria-expanded,
 * required aria-label on the trigger.
 * Bilingual (SIN-01): zero user-facing strings hardcoded. Every label is a
 * required prop or a required formatter function — no optional prop with an
 * English default anywhere in this file.
 *
 * Closes T1 (bu-mcp memory wave) — mosaic-memory-card.
 *
 * @example
 * // Detailed variant (default) — full card with tags row and labelled footer
 * <MosaicMemoryCard
 *   memory={memory}
 *   editLabel="Edit"
 *   deleteLabel="Delete"
 *   moreActionsLabel="Memory actions"
 *   formatScope={(scope) => t(`memory.scope.${scope}`)}
 *   formatTimeAgo={(createdAt) => formatRelative(createdAt)}
 *   formatUsageCount={(count) => t("memory.usageCount", { count })}
 *   formatMoreTags={(count) => `+${count}`}
 *   onEdit={(m) => openEditDialog(m)}
 *   onDelete={(id) => deleteMemory(id)}
 * />
 *
 * @example
 * // Compact variant — condensed list row, no tags row. formatUsageCount is
 * // still called here; this host simply chooses to render the bare number.
 * <MosaicMemoryCard
 *   memory={memory}
 *   variant="compact"
 *   editLabel="Modifier"
 *   deleteLabel="Supprimer"
 *   moreActionsLabel="Actions sur le souvenir"
 *   formatScope={(scope) => t(`memory.scope.${scope}`)}
 *   formatTimeAgo={(createdAt) => formatRelative(createdAt)}
 *   formatUsageCount={(count) => `${count}`}
 *   formatMoreTags={(count) => `+${count}`}
 * />
 */

import * as React from "react";
import {
  memoryActionsMenuTriggerVariants,
  memoryCardVariants,
  memoryScopeBadgeVariants,
  memoryTagBadgeVariants,
} from "./memory-card-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicMemoryScope = "organization" | "workspace" | "user" | "chat";
export type MosaicMemorySource = "manual" | "document" | "url";

export interface MosaicMemoryData {
  id: string;
  title: string;
  content: string;
  scope: MosaicMemoryScope;
  source: MosaicMemorySource;
  tags: string[];
  /** Epoch milliseconds. */
  createdAt: number;
  usageCount: number;
}

export interface MosaicMemoryCardProps {
  memory: MosaicMemoryData;
  /**
   * Layout density.
   * - `"detailed"` (default): icon chip + tags row + labelled usage footer.
   * - `"compact"`: condensed header row, no tags row, raw usage number.
   * @default "detailed"
   */
  variant?: "detailed" | "compact";
  onEdit?: (memory: MosaicMemoryData) => void;
  onDelete?: (memoryId: string) => void;
  /** Label for the "edit" menu item. Required — host-owned, no default. */
  editLabel: string;
  /** Label for the "delete" menu item. Required — host-owned, no default. */
  deleteLabel: string;
  /** aria-label for the 3-dot actions menu trigger. Required — host-owned, no default. */
  moreActionsLabel: string;
  /**
   * Formatter mapping `memory.scope` to its displayed label. Required — the
   * host owns the language (e.g. `(scope) => t(\`memory.scope.\${scope}\`)`).
   */
  formatScope: (scope: MosaicMemoryScope) => React.ReactNode;
  /**
   * Formatter producing the relative time caption from `memory.createdAt`.
   * Required — the host owns date formatting and language
   * (e.g. `(createdAt) => t("memory.timeAgo", { value: formatRelative(createdAt) })`).
   */
  formatTimeAgo: (createdAt: number) => React.ReactNode;
  /**
   * Formatter producing the labelled usage-count caption from
   * `memory.usageCount`. Applied in BOTH variants — the raw number is never
   * rendered directly. A host that wants the bare number in compact passes
   * `formatUsageCount={(count) => String(count)}`; that is the host's
   * choice, not a hidden default of the library.
   * Required — host-owned (e.g. `(count) => t("memory.usageCount", { count })`).
   */
  formatUsageCount: (count: number) => React.ReactNode;
  /**
   * Formatter producing the "+N" overflow caption when a memory has more
   * than 3 tags. Only rendered in the detailed variant. Required —
   * host-owned (e.g. `(count) => \`+\${count}\`` or a pluralized `t()` call).
   */
  formatMoreTags: (count: number) => React.ReactNode;
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

const MAX_VISIBLE_TAGS = 3;

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function FileTextIcon() {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function FileIcon() {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function LinkIcon() {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
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

function TagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function MoreVertIcon() {
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
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

const SOURCE_ICONS: Record<MosaicMemorySource, () => React.ReactElement> = {
  manual: FileTextIcon,
  document: FileIcon,
  url: LinkIcon,
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMemoryCard — production memory-item card for @vantageos/mosaic-blocks.
 *
 * One component, two density variants (`detailed` default / `compact`) —
 * see file JSDoc for the exact desktop/mobile differences and how they were
 * modeled as `variant` + CVA compound variants rather than as two components.
 */
export function MosaicMemoryCard({
  memory,
  variant = "detailed",
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  moreActionsLabel,
  formatScope,
  formatTimeAgo,
  formatUsageCount,
  formatMoreTags,
  className,
  ref,
}: MosaicMemoryCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const SourceIcon = SOURCE_ICONS[memory.source];
  const isDetailed = variant === "detailed";

  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const visibleTags = memory.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = memory.tags.length - visibleTags.length;

  const actionsMenu = (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={moreActionsLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={cn(memoryActionsMenuTriggerVariants({ variant }))}
      >
        <MoreVertIcon />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border",
            "bg-popover py-1 shadow-md",
          )}
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onEdit(memory);
                setMenuOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {editLabel}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDelete(memory.id);
                setMenuOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      data-slot="memory-card"
      data-variant={variant}
      className={cn(memoryCardVariants({ variant }), className)}
    >
      {isDetailed ? (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                <SourceIcon />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-base font-semibold">{memory.title}</h3>
                <span
                  className={cn(
                    memoryScopeBadgeVariants({ scope: memory.scope, bordered: true }),
                    "mt-1",
                  )}
                >
                  {formatScope(memory.scope)}
                </span>
              </div>
            </div>
            {actionsMenu}
          </div>

          {/* Content */}
          <p className="line-clamp-3 text-sm text-muted-foreground">{memory.content}</p>

          {/* Tags */}
          <div data-slot="memory-tags" className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span key={tag} className={cn(memoryTagBadgeVariants())}>
                {tag}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className={cn(memoryTagBadgeVariants())}>{formatMoreTags(hiddenTagCount)}</span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClockIcon />
              {formatTimeAgo(memory.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <TagIcon />
              {formatUsageCount(memory.usageCount)}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-sm font-medium">{memory.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{memory.content}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <SourceIcon />
              {actionsMenu}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className={cn(memoryScopeBadgeVariants({ scope: memory.scope, bordered: false }))}
              >
                {formatScope(memory.scope)}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon />
                {formatTimeAgo(memory.createdAt)}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <TagIcon />
              {formatUsageCount(memory.usageCount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

MosaicMemoryCard.displayName = "MosaicMemoryCard";
