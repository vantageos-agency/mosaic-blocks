/**
 * MosaicDocumentTable — generic document table, a composition of GrilleRegistre.
 *
 * One table component serves every document screen: this module renders through
 * the library's shared AG Grid (GrilleRegistre) and adds only the document-review
 * contract on top of it — the column model, the row selection and the panel.
 *
 * Rows and the column model come from props; column visibility comes from the
 * model (`defaultVisible`) unless the host passes a `columnVisibility` override.
 * Selecting a row (click, Enter, Space) opens `renderPanel` for that row. The
 * module ships no business vocabulary: every label is a prop, the empty state
 * included (GrilleRegistre's `messageVide`).
 *
 * Row activation: the first visible column renders its value inside a real
 * `<button>` (keyboard + assistive tech), and a click on any cell of a row —
 * the button's keyboard activation arrives as a click — is resolved to its row
 * through the grid's `onCellClicked`, one path for both. Grid cells take no focus
 * of their own (`suppressCellFocus`), so each row's button is its keyboard stop.
 *
 * Sorting and filtering are off on every column: the table keeps the host's row
 * order, which is also the order prev/next navigation walks (`orderedRowIds`).
 */
import type { CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { createContext, useContext, useMemo, useState } from "react";
import type * as React from "react";
import { GrilleRegistre } from "../registre/GrilleRegistre.js";
import { refitColumns } from "../registre/grid-theme.js";
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

// The selected row id reaches the first-column renderer through React context:
// ag-grid-react renders cell renderers in portals of this tree, so a selection
// change re-renders the marked button without rebuilding the column definitions.
const SelectedRowIdContext = createContext<string | null>(null);

function OpenRowButton({ value, node }: ICellRendererParams) {
  const selectedRowId = useContext(SelectedRowIdContext);
  const isSelected = node.id !== undefined && node.id === selectedRowId;
  return (
    <button
      type="button"
      data-slot="document-table-open"
      aria-current={isSelected ? "true" : undefined}
      data-selected={isSelected ? "true" : undefined}
      className="text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {value as string}
    </button>
  );
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

  const columnDefs = useMemo<ColDef<T>[]>(
    () =>
      visibleColumns(columns, columnVisibility ?? initialColumnVisibility(columns)).map(
        (column, columnIndex) => ({
          colId: column.id,
          headerName: column.label,
          // The column model's value, as text: null reads as an empty cell.
          valueGetter: (params) => {
            if (params.data === undefined) return "";
            const value = column.accessor(params.data);
            return value === null ? "" : String(value);
          },
          // No type inference: a boolean stays text, never a grid checkbox.
          cellDataType: false,
          sortable: false,
          filter: false,
          floatingFilter: false,
          ...(columnIndex === 0 ? { cellRenderer: OpenRowButton } : {}),
        }),
      ),
    [columns, columnVisibility],
  );

  function handleCellClicked(event: CellClickedEvent<T>) {
    if (event.data !== undefined) select(getRowId(event.data));
  }

  const orderedRowIds = rows.map(getRowId);
  const selectedRow =
    selectedRowId === null ? undefined : rows.find((row) => getRowId(row) === selectedRowId);

  return (
    <div data-slot="document-table" className={className}>
      <SelectedRowIdContext.Provider value={selectedRowId}>
        <GrilleRegistre<T>
          lignes={rows}
          columnDefs={columnDefs}
          getRowId={getRowId}
          onCellClicked={handleCellClicked}
          suppressCellFocus
          domLayout="autoHeight"
          onGridSizeChanged={refitColumns}
          messageVide={emptyMessage}
        />
      </SelectedRowIdContext.Provider>
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
