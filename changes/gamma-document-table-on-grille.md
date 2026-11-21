# gamma-document-table-on-grille — MosaicDocumentTable renders through GrilleRegistre

**Version:** derived after merge (the release-artifacts guard forbids a version bump in a component PR)
**Branch:** gamma/document-table-on-grille
**Author:** Gamma — VantageOS Team | 2026-11-21

## Summary

`MosaicDocumentTable` is rebuilt as a composition of `GrilleRegistre`, so the document-review table and the registry grid are one table component. Its public API is unchanged (`MosaicDocumentTableProps<T>`, `MosaicDocumentTableRowContext`, the function signature — identical declarations in `dist/index.d.ts`), so a host only bumps the version.

## Mapping

- Column model -> AG Grid `columnDefs`: `colId` = column id, `headerName` = label, a `valueGetter` reading the accessor as text (null -> empty), `cellDataType: false` (a boolean stays text).
- First visible column -> a cell renderer holding the real `<button data-slot="document-table-open">`; the selected row is read from React context, so a selection change re-renders the mark without rebuilding the columns.
- Row click / button activation -> `GrilleRegistre.onCellClicked`, one path for both (AG Grid dispatches `cellClicked` asynchronously).
- Keyboard: `suppressCellFocus` — grid cells take no tab focus, each row's button is its keyboard stop.
- Host row order kept: every column `sortable: false`, `filter: false`, `floatingFilter: false`.
- Height grows with the rows: `domLayout="autoHeight"` + `refitColumns` on size change.
- Empty state -> `GrilleRegistre.messageVide` (new optional prop, the no-rows overlay text).

## GrilleRegistre addition

`messageVide?: string` — text of AG Grid's provided no-rows overlay (`overlayComponentParams.noRows.overlayText`). Generic, host-supplied; omitted, AG Grid's default overlay text stays.
