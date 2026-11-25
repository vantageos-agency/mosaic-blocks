/**
 * @vantageos/mosaic-blocks/grid
 *
 * The components built on AG Grid Community, behind their own entry so the root entry
 * (`@vantageos/mosaic-blocks`) never loads an AG Grid package. A host that renders none of them
 * installs neither `ag-grid-community` nor `ag-grid-react` (both are optional peers); a host that
 * renders one of them installs both and imports it from this subpath:
 *
 *   import { GrilleRegistre, MosaicDocumentTable } from "@vantageos/mosaic-blocks/grid";
 *
 * Membership rule: a component whose module graph imports an `ag-grid-*` package is exported from
 * here, never from `src/index.ts`. The entry census (`e2e/root-without-grid/census.mjs`) fails
 * when the built root entry loads one.
 */

// ── registre: the shared AG Grid registry grid and its theme helpers ─────────
export { GrilleRegistre } from "./components/registre/GrilleRegistre.js";
export type { GrilleRegistreProps } from "./components/registre/GrilleRegistre.js";
export {
  fitGridWidthStrategy,
  refitColumns,
  registreGridTheme,
} from "./components/registre/grid-theme.js";

// ── document-review: the document table, rendered through GrilleRegistre ─────
export { MosaicDocumentTable } from "./components/document-review/MosaicDocumentTable.js";
export type {
  MosaicDocumentTableProps,
  MosaicDocumentTableRowContext,
} from "./components/document-review/MosaicDocumentTable.js";
