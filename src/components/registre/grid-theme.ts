/**
 * The default AG Grid theme of a registry grid (GrilleRegistre), on AG Grid's
 * Theming API (no `ag-theme-*` class). Every colour is a HeroUI theme variable:
 * the registry blocks are built on HeroUI, so a host rendering them already
 * ships those variables. A host with its own brand passes its own theme through
 * GrilleRegistre's `theme` prop instead.
 */
import type { SizeColumnsToFitGridStrategy } from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";

export const registreGridTheme = themeQuartz.withParams({
  accentColor: "var(--accent)",
  backgroundColor: "var(--surface)",
  foregroundColor: "var(--foreground)",
  textColor: "var(--foreground)",
  borderColor: "var(--border)",
  headerBackgroundColor: "var(--surface-secondary)",
  headerTextColor: "var(--surface-secondary-foreground)",
  headerFontWeight: 600,
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  headerFontSize: 13,
  rowHeight: 40,
  headerHeight: 44,
  spacing: 8,
  wrapperBorderRadius: 8,
  rowHoverColor: "var(--surface-hover)",
  // No `selectedRowBackgroundColor`: the grid does not use the native AG Grid row
  // selection. A host highlights its selected row through `getRowStyle`.
});

/** Columns fill the grid's width instead of leaving a blank strip on the right. */
export const fitGridWidthStrategy: SizeColumnsToFitGridStrategy = {
  type: "fitGridWidth",
};

/** fitGridWidth sizes once; refit whenever the grid's width changes (pass to `onGridSizeChanged`). */
export function refitColumns(e: { api: { sizeColumnsToFit: () => void } }): void {
  e.api.sizeColumnsToFit();
}
