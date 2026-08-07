/**
 * MosaicArtifactChecklist — dumb, contract-agnostic checklist artifact renderer
 *
 * Renders a normalized checklist artifact payload on top of the existing
 * `MosaicProgress` atom (reuse-first). Owns no knowledge of its runtime
 * source (@ai-sdk-tools/artifacts vs the MCP Apps ui:// bridge); it consumes
 * the same `data` shape either source normalizes to.
 *
 * Read-only presentation. Ported from any-debate-ai's ChecklistArtifact,
 * stripped of the toggle/add/delete/bulk-action state to keep this a pure
 * render component, per the C1 adapter contract.
 *
 * data-slot="artifact-checklist" on the root, "artifact-checklist-item" per item.
 *
 * i18n: zero hardcoded user-facing strings — every label is a required
 * prop (mosaic-blocks doctrine, see src/__tests__/i18n-no-hardcoded-literals.test.ts).
 */

import type * as React from "react";
import { MosaicProgress } from "../progress/MosaicProgress.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Data shape ────────────────────────────────────────────────────────────────

export type MosaicArtifactChecklistPriority = "low" | "medium" | "high";

export interface MosaicArtifactChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: MosaicArtifactChecklistPriority;
  dueDate?: number | string;
  assignee?: string;
  notes?: string;
}

export interface MosaicArtifactChecklistData {
  title: string;
  description?: string;
  items: MosaicArtifactChecklistItem[];
  metadata?: {
    category?: string;
  };
}

export interface MosaicArtifactChecklistLabels {
  /** Accessible text for the "Checklist" type badge. */
  typeBadgeLabel: string;
  /** Formats the header completed/total badge, e.g. (c, t) => `${c}/${t}`. */
  progressLabel: (completed: number, total: number) => string;
  /** Formats the progress-section summary line. */
  completedOfTotalLabel: (completed: number, total: number, percent: number) => string;
  /** Shown when there are no items. */
  emptyMessage: string;
  /** Localizes an item's priority badge. */
  priorityLabel: (priority: MosaicArtifactChecklistPriority) => string;
}

export interface MosaicArtifactChecklistProps {
  data: MosaicArtifactChecklistData;
  labels: MosaicArtifactChecklistLabels;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicArtifactChecklist — read-only checklist artifact renderer.
 *
 * @example
 * <MosaicArtifactChecklist
 *   data={{ title: "Launch checklist", items: [{ id: "i1", text: "Ship PR", completed: false }] }}
 *   labels={{
 *     typeBadgeLabel: "Checklist",
 *     progressLabel: (c, t) => `${c}/${t}`,
 *     completedOfTotalLabel: (c, t, p) => `${c} of ${t} completed (${p}%)`,
 *     emptyMessage: "No items yet.",
 *     priorityLabel: (p) => ({ low: "Low", medium: "Medium", high: "High" })[p],
 *   }}
 * />
 */
export function MosaicArtifactChecklist({
  data,
  labels,
  className,
  ref,
}: MosaicArtifactChecklistProps) {
  const completedCount = data.items.filter((item) => item.completed).length;
  const totalCount = data.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div
      ref={ref}
      data-slot="artifact-checklist"
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <h3 className="font-medium text-base">{data.title}</h3>
        <span
          data-slot="artifact-checklist-type-badge"
          className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
        >
          {labels.typeBadgeLabel}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
          {labels.progressLabel(completedCount, totalCount)}
        </span>
      </div>

      <div className="space-y-3 border-border border-b bg-muted/20 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {labels.completedOfTotalLabel(completedCount, totalCount, Math.round(progress))}
          </span>
        </div>
        <MosaicProgress value={progress} aria-label={labels.typeBadgeLabel} />
        {data.description && <p className="text-muted-foreground text-sm">{data.description}</p>}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {totalCount === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">{labels.emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {data.items.map((item) => (
              <li
                key={item.id}
                data-slot="artifact-checklist-item"
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  item.completed
                    ? "border-primary/20 bg-primary/10"
                    : "border-border bg-background",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 rounded border-2",
                    item.completed ? "border-primary bg-primary" : "border-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm leading-relaxed",
                        item.completed && "text-muted-foreground line-through",
                      )}
                    >
                      {item.text}
                    </span>
                    {item.priority && (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs">
                        {labels.priorityLabel(item.priority)}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="mt-2 rounded bg-muted/50 p-2 text-muted-foreground text-xs">
                      {item.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.metadata?.category && (
        <div className="border-border border-t bg-muted/20 px-4 py-3 text-muted-foreground text-xs">
          {data.metadata.category}
        </div>
      )}
    </div>
  );
}

MosaicArtifactChecklist.displayName = "MosaicArtifactChecklist";
