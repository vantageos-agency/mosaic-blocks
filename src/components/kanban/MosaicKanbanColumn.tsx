/**
 * MosaicKanbanColumn — vertical column within a MosaicKanbanBoard.
 *
 * Presentational container — cards are caller-provided children.
 * Renders: header (title + optional count badge + optional trailing actions)
 *          scrollable card stack (children)
 *          optional footer (e.g. "load more" / Convex paginate trigger)
 *
 * No drag-drop logic, no data fetching, no "use client" directive.
 * data-slot="kanban-column" for composability and testing.
 *
 * Design tokens: Tailwind v4 semantic classes only (border-border, bg-muted,
 * text-muted-foreground, bg-background). No hardcoded colors.
 *
 * i18n: `countLabel` is a REQUIRED prop — the host owns the language (e.g.
 * next-intl `t()`). No English default, no fallback lives in this component.
 *
 * @example
 * // Host owns i18n (e.g. next-intl) — countLabel is always a required prop.
 * <MosaicKanbanColumn
 *   title="To Do"
 *   count={3}
 *   countLabel={(n) => t('Kanban.itemCount', { count: n })}
 * >
 *   <TaskCard task={task} />
 * </MosaicKanbanColumn>
 *
 * // French host
 * <MosaicKanbanColumn
 *   title="À faire"
 *   count={3}
 *   countLabel={(n) => `${n} éléments`}
 *   headerActions={<button aria-label={t('Kanban.aria.addTask')}>+</button>}
 *   footer={<button>{t('Kanban.loadMore')}</button>}
 * >
 *   <TaskCard task={task} />
 * </MosaicKanbanColumn>
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicKanbanColumnProps {
  /** Column heading — caller-provided; can be a string or any ReactNode. */
  title: React.ReactNode;
  /** Optional item count rendered as a badge in the header. */
  count?: number;
  /** Optional trailing slot in the header (e.g. add-task button). */
  headerActions?: React.ReactNode;
  /** Card children — caller-owned. */
  children: React.ReactNode;
  /** Optional footer slot (e.g. "Load more" / Convex pagination button). */
  footer?: React.ReactNode;
  /**
   * Formatter for the count badge aria-label. Required — the host owns the
   * language (e.g. FR: `(n) => \`${n} éléments\``). No default, no fallback.
   */
  countLabel: (count: number) => string;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

/**
 * MosaicKanbanColumn — single column within MosaicKanbanBoard.
 *
 * Replaces TaskColumn / MandateColumn in the VP shell.
 * The column is a fixed-width, shrink-0 card with a scrollable body.
 * Title and labels are caller-provided — no hardcoded English strings.
 *
 * @example
 * <MosaicKanbanColumn title="En cours" count={2} countLabel={(n) => `${n} éléments`}>
 *   <TaskCard />
 * </MosaicKanbanColumn>
 */
export function MosaicKanbanColumn({
  title,
  count,
  headerActions,
  children,
  footer,
  countLabel,
  className,
  ref,
}: MosaicKanbanColumnProps) {
  return (
    <section
      ref={ref}
      data-slot="kanban-column"
      className={cn(
        // Fixed column width, never shrink so board stays scrollable
        "flex flex-col w-72 shrink-0",
        // Surface
        "rounded-lg border border-border bg-muted/30",
        className,
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        data-slot="kanban-column-header"
        className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{title}</span>
          {count !== undefined && (
            <span
              data-slot="kanban-column-count"
              aria-label={countLabel(count)}
              className={cn(
                "inline-flex items-center justify-center",
                "min-w-[1.25rem] h-5 px-1.5 rounded-full",
                "bg-muted text-muted-foreground",
                "text-xs font-medium tabular-nums",
                "select-none",
              )}
            >
              {count}
            </span>
          )}
        </div>
        {headerActions && (
          <div
            data-slot="kanban-column-header-actions"
            className="flex items-center gap-1 shrink-0"
          >
            {headerActions}
          </div>
        )}
      </div>

      {/* ── Card stack ─────────────────────────────────────────────────── */}
      <div
        data-slot="kanban-column-body"
        className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-0"
      >
        {children}
      </div>

      {/* ── Footer (optional) ──────────────────────────────────────────── */}
      {footer && (
        <div
          data-slot="kanban-column-footer"
          className="px-3 py-2 border-t border-border text-sm text-muted-foreground"
        >
          {footer}
        </div>
      )}
    </section>
  );
}

MosaicKanbanColumn.displayName = "MosaicKanbanColumn";
