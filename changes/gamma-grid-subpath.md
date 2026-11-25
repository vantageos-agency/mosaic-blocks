# gamma-grid-subpath — the AG Grid components move to `@vantageos/mosaic-blocks/grid`

**Version:** derived after merge (the release-artifacts guard forbids a version bump in a component PR)
**Branch:** gamma/grid-subpath
**Author:** Gamma — VantageOS Team | 2026-11-25

## Summary

The root entry no longer imports `ag-grid-community` or `ag-grid-react`. The components that need them are exported from a new entry, `./grid`, and both AG Grid packages become optional peers. A host that renders no grid builds without installing AG Grid.

## Breaking change and migration

```diff
- import { GrilleRegistre, MosaicDocumentTable } from "@vantageos/mosaic-blocks";
+ import { GrilleRegistre, MosaicDocumentTable } from "@vantageos/mosaic-blocks/grid";
```

Moved to `./grid`: `GrilleRegistre`, `GrilleRegistreProps`, `registreGridTheme`, `fitGridWidthStrategy`, `refitColumns`, `MosaicDocumentTable`, `MosaicDocumentTableProps`, `MosaicDocumentTableRowContext`. A host using one of them installs `ag-grid-community` and `ag-grid-react`.

## Peer to component map

- `ag-grid-community`, `ag-grid-react`: `GrilleRegistre`, its theme helpers (`grid-theme.ts`) and `MosaicDocumentTable` (renders through `GrilleRegistre`). Entry `./grid`; optional peers.
- `@heroui/react`: `RegistreEcran`, `ChoixColonnes`, `PanneauRegistreShell`. Root entry; required peer (unchanged).
- `lucide-react`: `RegistreEcran`, `PanneauRegistreShell`, `RegistreLigneDetail`. Root entry; required peer (unchanged).

## Tooling

The component surface is read from package.json `exports` (`componentBarrels`), so the counts, the README guard, the prop-contract coverage test, `registry-json-derive` and the no-hardcoded-words guard cover `src/grid.ts` / `dist/grid.cjs` too. Counts and `registry.json` are unchanged.
