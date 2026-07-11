"use client";

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
 * @example
 * <MosaicKanbanColumn
 *   title="À faire"
 *   count={3}
 *   headerActions={<button aria-label="Ajouter une tâche">+</button>}
 *   footer={<button>Charger plus</button>}
 * >
 *   <TaskCard task={task} />
 * </MosaicKanbanColumn>
 */

import type * as React from "react";
import { useMosaicT } from "../../i18n/useMosaicT.js";

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
 * <MosaicKanbanColumn title="En cours" count={2}>
 *   <TaskCard />
 * </MosaicKanbanColumn>
 */
export function MosaicKanbanColumn({
  title,
  count,
  headerActions,
  children,
  footer,
  className,
  ref,
}: MosaicKanbanColumnProps) {
  const t = useMosaicT();

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
              aria-label={t("KanbanColumn.aria.count", { count })}
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
