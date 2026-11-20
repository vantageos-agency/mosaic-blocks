/**
 * GrilleRegistre — the shared AG Grid of a registry screen: AG Grid Community, a
 * stable row identity, and every column sortable, filterable (with a floating
 * filter) and resizable.
 *
 * THIS MODULE DECIDES NOTHING ABOUT COLUMNS. The caller passes its own
 * `columnDefs`. The grid-level behaviours a registry screen may need — in-grid
 * edit, a selected-row style, cell tooltips — are forwarded as optional props,
 * never wired in here.
 */
import type {
  CellClickedEvent,
  CellValueChangedEvent,
  ColDef,
  GridReadyEvent,
  GridSizeChangedEvent,
  RowClassParams,
  RowStyle,
  Theme,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { fitGridWidthStrategy, registreGridTheme } from "./grid-theme.js";

// Registered on first render, not at import: a host importing the package
// without rendering a grid gets no global AG Grid side effect.
let modulesRegistered = false;
function ensureModules(): void {
  if (modulesRegistered) return;
  ModuleRegistry.registerModules([AllCommunityModule]);
  modulesRegistered = true;
}

/** Every column sorts, filters (with a floating filter) and resizes. */
const DEFAUTS: ColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  floatingFilter: true,
};

export interface GrilleRegistreProps<T> {
  lignes: readonly T[];
  columnDefs: readonly ColDef<T>[];
  /** Stable row identity: a correction after a sort reaches its row. */
  getRowId: (ligne: T) => string;
  /** Global search, applied by the grid across every visible column. */
  filtreGlobal?: string;
  /** AG Grid theme; defaults to `registreGridTheme` (HeroUI variables). */
  theme?: Theme;
  onGridReady?: (e: GridReadyEvent<T>) => void;
  /** Fired when a grid cell has just been validated (in-grid edit). */
  onCelluleEditee?: (e: CellValueChangedEvent<T>) => void;
  /** Per-row style, e.g. the selected-row highlight. */
  getRowStyle?: (p: RowClassParams<T>) => RowStyle | undefined;
  /** ms before a cell tooltip shows; set when columns carry tooltips. */
  tooltipShowDelay?: number;
  /** false lets a cell take keyboard focus (needed for in-grid edit). */
  suppressCellFocus?: boolean;
  /** A cell click, e.g. to open a row's detail panel. */
  onCellClicked?: (e: CellClickedEvent<T>) => void;
  /** Fixed row height; set when a cell carries a tall control (a row action). */
  rowHeight?: number;
  /** AG Grid layout; `"autoHeight"` grows the grid to its rows (no inner scroll). */
  domLayout?: "normal" | "autoHeight" | "print";
  /** Refit columns on a size change — `refitColumns` on an autoHeight grid. */
  onGridSizeChanged?: (e: GridSizeChangedEvent<T>) => void;
}

export function GrilleRegistre<T>({
  lignes,
  columnDefs,
  getRowId,
  filtreGlobal,
  theme = registreGridTheme,
  onGridReady,
  onCelluleEditee,
  getRowStyle,
  tooltipShowDelay,
  suppressCellFocus,
  onCellClicked,
  rowHeight,
  domLayout,
  onGridSizeChanged,
}: GrilleRegistreProps<T>) {
  ensureModules();
  // The parent sets the height unless the caller asks for autoHeight.
  return (
    <div className="isolate h-full min-h-0 w-full">
      <AgGridReact<T>
        theme={theme}
        autoSizeStrategy={fitGridWidthStrategy}
        rowData={lignes as T[]}
        columnDefs={columnDefs as ColDef<T>[]}
        defaultColDef={DEFAUTS}
        quickFilterText={filtreGlobal}
        getRowId={(p) => getRowId(p.data)}
        onGridReady={onGridReady}
        onCellValueChanged={onCelluleEditee}
        onCellClicked={onCellClicked}
        getRowStyle={getRowStyle}
        tooltipShowDelay={tooltipShowDelay}
        suppressCellFocus={suppressCellFocus}
        rowHeight={rowHeight}
        domLayout={domLayout}
        onGridSizeChanged={onGridSizeChanged}
        animateRows
      />
    </div>
  );
}
