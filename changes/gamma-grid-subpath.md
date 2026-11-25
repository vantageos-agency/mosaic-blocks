# gamma-grid-subpath — AG Grid components to `./grid`, registry-screen blocks to `./registre`

**Version:** derived after merge (the release-artifacts guard forbids a version bump in a component PR)
**Branch:** gamma/grid-subpath
**Author:** Gamma — VantageOS Team | 2026-11-25

## Summary

The root entry no longer imports `ag-grid-community`, `ag-grid-react`, `@heroui/react` or `lucide-react`. The components that need them are exported from two new entries, `./grid` and `./registre`, and all four packages become optional peers. A host that renders none of those components builds without installing any of them. HeroUI stays the library the registry-screen blocks are built on.

## Breaking change and migration

```diff
- import { GrilleRegistre, MosaicDocumentTable } from "@vantageos/mosaic-blocks";
+ import { GrilleRegistre, MosaicDocumentTable } from "@vantageos/mosaic-blocks/grid";
- import { RegistreEcran, PanneauRegistreShell } from "@vantageos/mosaic-blocks";
+ import { RegistreEcran, PanneauRegistreShell } from "@vantageos/mosaic-blocks/registre";
```

- Moved to `./grid`: `GrilleRegistre`, `GrilleRegistreProps`, `registreGridTheme`, `fitGridWidthStrategy`, `refitColumns`, `MosaicDocumentTable`, `MosaicDocumentTableProps`, `MosaicDocumentTableRowContext`. Install `ag-grid-community` and `ag-grid-react`.
- Moved to `./registre`: `RegistreEcran`, `PanneauRegistreShell`, `RegistreLigneDetail`, `ChoixColonnes`, `estVisible` and their label/props/column types. Install `@heroui/react` (with its styles) and `lucide-react`. Known host to update: pujol-reporting (imports `RegistreEcran` from the root).

## Peer to component map

- `ag-grid-community`, `ag-grid-react`: `GrilleRegistre`, its theme helpers (`grid-theme.ts`), `MosaicDocumentTable` (renders through `GrilleRegistre`). Entry `./grid`.
- `@heroui/react`: `RegistreEcran`, `ChoixColonnes`, `PanneauRegistreShell`. Entry `./registre`.
- `lucide-react`: `RegistreEcran`, `PanneauRegistreShell`, `RegistreLigneDetail`. Entry `./registre`.
- `colonnes.ts` (`estVisible`, column types): used only by the registry-screen blocks. Entry `./registre`.

## Tooling

The component surface is read from package.json `exports` (`componentBarrels`), so the counts, the README guard, the prop-contract coverage test, `registry-json-derive` and the no-hardcoded-words guard cover `src/grid.ts`, `src/registre.ts` and their bundles. Counts and `registry.json` are unchanged.
