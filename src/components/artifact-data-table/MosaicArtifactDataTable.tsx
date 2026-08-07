/**
 * MosaicArtifactDataTable — dumb, contract-agnostic data-table artifact renderer
 *
 * Renders a normalized data-table artifact payload on top of the existing
 * `MosaicDataTable` atom (reuse-first — no re-implementation of sort/render
 * logic). Owns no knowledge of its runtime source (@ai-sdk-tools/artifacts vs
 * the MCP Apps ui:// bridge); it consumes the same `data` shape either source
 * normalizes to.
 *
 * Read-only presentation. Ported from any-debate-ai's DataTableArtifact,
 * stripped of inline-edit/add-row/delete-row/search state to keep this a
 * pure render component, per the C1 adapter contract.
 *
 * data-slot="artifact-data-table" on the root.
 *
 * i18n: zero hardcoded user-facing strings — every label is a required
 * prop (mosaic-blocks doctrine, see src/__tests__/i18n-no-hardcoded-literals.test.ts).
 */

import type * as React from "react";
import { MosaicDataTable } from "../data-table/MosaicDataTable.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Data shape ────────────────────────────────────────────────────────────────

export interface MosaicArtifactDataTableColumn {
  id: string;
  name: string;
  type: "string" | "number" | "boolean";
  width?: number;
}

export interface MosaicArtifactDataTableData {
  title: string;
  columns: MosaicArtifactDataTableColumn[];
  rows: Record<string, unknown>[];
  metadata?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
}

export interface MosaicArtifactDataTableLabels {
  /** Accessible text for the "Data Table" type badge. */
  typeBadgeLabel: string;
  /** Formats the row/column count badge, e.g. (rows, cols) => `${rows} rows × ${cols} cols`. */
  rowsColsLabel: (rows: number, cols: number) => string;
  /** Shown when there are no rows. */
  emptyMessage: string;
  /** Boolean-column cell label for `true`. */
  yesLabel: string;
  /** Boolean-column cell label for `false`. */
  noLabel: string;
}

export interface MosaicArtifactDataTableProps {
  data: MosaicArtifactDataTableData;
  labels: MosaicArtifactDataTableLabels;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicArtifactDataTable — read-only data-table artifact renderer.
 *
 * @example
 * <MosaicArtifactDataTable
 *   data={{ title: "Q3 pipeline", columns: [...], rows: [...] }}
 *   labels={{
 *     typeBadgeLabel: "Data Table",
 *     rowsColsLabel: (r, c) => `${r} rows × ${c} cols`,
 *     emptyMessage: "No rows.",
 *     yesLabel: "Yes",
 *     noLabel: "No",
 *   }}
 * />
 */
export function MosaicArtifactDataTable({
  data,
  labels,
  className,
  ref,
}: MosaicArtifactDataTableProps) {
  return (
    <div
      ref={ref}
      data-slot="artifact-data-table"
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <h3 className="font-medium text-base">{data.title}</h3>
        <span
          data-slot="artifact-data-table-type-badge"
          className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs"
        >
          {labels.typeBadgeLabel}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
          {labels.rowsColsLabel(data.rows.length, data.columns.length)}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <MosaicDataTable
          columns={data.columns.map((column) => ({
            key: column.id,
            header: column.name,
            render: (row: Record<string, unknown>) => {
              const value = row[column.id];
              if (column.type === "boolean") {
                return (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground text-xs">
                    {value ? labels.yesLabel : labels.noLabel}
                  </span>
                );
              }
              if (column.type === "number") {
                return <span className="font-mono">{String(value ?? "")}</span>;
              }
              return String(value ?? "");
            },
          }))}
          rows={data.rows}
          emptyMessage={labels.emptyMessage}
        />
      </div>
    </div>
  );
}

MosaicArtifactDataTable.displayName = "MosaicArtifactDataTable";
