/**
 * MosaicKanbanBoard — horizontal scrollable kanban board container.
 *
 * Presentational container — columns are caller-provided children.
 * No drag-drop logic, no data fetching, no "use client" directive.
 * data-slot="kanban-board" for composability and testing.
 *
 * Design tokens: Tailwind v4 semantic classes only. No hardcoded colors.
 *
 * @example
 * <MosaicKanbanBoard>
 *   <MosaicKanbanColumn title="À faire" count={3}>
 *     <TaskCard />
 *   </MosaicKanbanColumn>
 *   <MosaicKanbanColumn title="En cours" count={1}>
 *     <TaskCard />
 *   </MosaicKanbanColumn>
 * </MosaicKanbanBoard>
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicKanbanBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Kanban columns (MosaicKanbanColumn elements). */
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * MosaicKanbanBoard — horizontal-scroll flex row of kanban columns.
 *
 * Replaces TaskBoard / MandateBoard / MissionBoard in the VP shell.
 * Pure presentational — columns and cards are caller-owned children.
 *
 * @example
 * <MosaicKanbanBoard>
 *   <MosaicKanbanColumn title="Backlog" count={5}>…</MosaicKanbanColumn>
 *   <MosaicKanbanColumn title="In Progress" count={2}>…</MosaicKanbanColumn>
 *   <MosaicKanbanColumn title="Done" count={12}>…</MosaicKanbanColumn>
 * </MosaicKanbanBoard>
 */
export function MosaicKanbanBoard({ children, className, ref, ...props }: MosaicKanbanBoardProps) {
  return (
    <div
      ref={ref}
      data-slot="kanban-board"
      className={cn(
        "flex gap-4 overflow-x-auto pb-4",
        "min-h-0",
        // Smooth momentum scrolling on iOS
        "[scroll-behavior:smooth]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

MosaicKanbanBoard.displayName = "MosaicKanbanBoard";
