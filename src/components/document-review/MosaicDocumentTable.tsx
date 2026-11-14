/**
 * MosaicDocumentTable — generic document table, built on MosaicDataTable.
 *
 * Rows and the column model come from props; column visibility comes from the
 * model (`defaultVisible`) unless the host passes a `columnVisibility` override.
 * Selecting a row (click, Enter, Space) opens `renderPanel` for that row. The
 * module ships no business vocabulary: every label is a prop.
 *
 * Row activation is delivered WITHOUT touching MosaicDataTable: the first visible
 * column renders its value inside a real `<button>` (keyboard + assistive tech),
 * and a click anywhere on a body row is resolved to its row through the table's own
 * `sectionRowIndex` (delegated on the wrapper).
 *
 * Sorting is off: MosaicDataTable sorts on `row[key]`, and a column model reads
 * values through accessors, so the table keeps the host's row order — which is
 * also the order prev/next navigation walks.
 */
import { useState } from "react";
import type * as React from "react";
import { MosaicDataTable, type MosaicDataTableColumn } from "../data-table/MosaicDataTable.js";
import {
  type ColumnVisibility,
  type ReviewColumn,
  initialColumnVisibility,
  visibleColumns,
} from "./document-review-logic.js";

export interface MosaicDocumentTableRowContext {
  rowId: string;
  /** Row ids in display order — what prev/next navigation walks. */
  orderedRowIds: string[];
  /** Select another row (the panel stays open on it). */
  selectRow: (rowId: string) => void;
  /** Close the panel. */
  closeRow: () => void;
}

export interface MosaicDocumentTableProps<T> {
  columns: ReviewColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Overrides the model's `defaultVisible` per column id. */
  columnVisibility?: ColumnVisibility;
  /** Controlled selection. Omit for internal state. */
  selectedRowId?: string | null;
  onSelectedRowChange?: (rowId: string | null) => void;
  /** Rendered for the selected row. */
  renderPanel?: (row: T, context: MosaicDocumentTableRowContext) => React.ReactNode;
  /** Required — the host owns the language. */
  emptyMessage: string;
  className?: string;
}

export function MosaicDocumentTable<T>({
  columns,
  rows,
  getRowId,
  columnVisibility,
  selectedRowId: controlledSelectedRowId,
  onSelectedRowChange,
  renderPanel,
  emptyMessage,
  className,
}: MosaicDocumentTableProps<T>) {
  const [internalSelectedRowId, setInternalSelectedRowId] = useState<string | null>(null);
  const isControlled = controlledSelectedRowId !== undefined;
  const selectedRowId = isControlled ? controlledSelectedRowId : internalSelectedRowId;

  function select(rowId: string | null) {
    if (!isControlled) setInternalSelectedRowId(rowId);
    onSelectedRowChange?.(rowId);
  }

  const shown = visibleColumns(columns, columnVisibility ?? initialColumnVisibility(columns));
  const tableColumns: MosaicDataTableColumn<T>[] = shown.map((column, columnIndex) => ({
    key: column.id,
    header: column.label,
    render: (row) => {
      const value = column.accessor(row);
      const text = value === null ? "" : String(value);
      if (columnIndex !== 0) return text;
      const isSelected = getRowId(row) === selectedRowId;
      return (
        <button
          type="button"
          data-slot="document-table-open"
          aria-current={isSelected ? "true" : undefined}
          data-selected={isSelected ? "true" : undefined}
          className="text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {text}
        </button>
      );
    },
  }));

  // One delegated handler: a click on any cell of a body row selects that row. A
  // button's keyboard activation arrives here as a click, so one path serves both.
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const tr = (event.target as HTMLElement).closest("tr[data-slot='data-table-row']");
    if (!(tr instanceof HTMLTableRowElement)) return;
    const row = rows[tr.sectionRowIndex];
    if (row !== undefined) select(getRowId(row));
  }

  const orderedRowIds = rows.map(getRowId);
  const selectedRow =
    selectedRowId === null ? undefined : rows.find((row) => getRowId(row) === selectedRowId);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard path is the first column's real <button>; this only resolves mouse clicks on other cells to their row
    <div data-slot="document-table" className={className} onClick={handleClick}>
      <MosaicDataTable<T>
        columns={tableColumns}
        rows={rows}
        getRowKey={(row) => getRowId(row)}
        sortable={false}
        emptyMessage={emptyMessage}
      />
      {selectedRow !== undefined && renderPanel
        ? renderPanel(selectedRow, {
            rowId: getRowId(selectedRow),
            orderedRowIds,
            selectRow: (rowId) => select(rowId),
            closeRow: () => select(null),
          })
        : null}
    </div>
  );
}

MosaicDocumentTable.displayName = "MosaicDocumentTable";
