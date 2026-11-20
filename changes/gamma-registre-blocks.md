# gamma-registre-blocks — registry-screen blocks

**Version:** derived after merge (the release-artifacts guard forbids a version bump in a component PR)
**Branch:** gamma/registre-blocks
**Author:** Gamma — VantageOS Team | 2026-11-20

## Summary

Four registry-screen blocks move from the first host application into the library so every host (UC5, UC2) mounts one version: `GrilleRegistre`, `RegistreEcran`, `PanneauRegistreShell`, `RegistreLigneDetail`, plus the generic pieces they need (`ChoixColonnes`, `ColonneRegistre` / `ColonneChoisie` / `EtatVisibilite` / `estVisible`, `registreGridTheme`, `fitGridWidthStrategy`, `refitColumns`).

## Moved vs made a prop

- Grid theme: moved as `registreGridTheme`, colours on HeroUI variables; a host brand passes its own through `GrilleRegistre.theme`.
- Column declaration (`ColonneRegistre`) and visibility state (`EtatVisibilite`, `estVisible`): moved, generic.
- Column chooser (`ChoixColonnes`): moved; its default column set became the required `colonnes` prop, its label casing the optional `formatLibelle`.
- Amount / number formatting and the edit decimal separator: required props (`formatMontant`, `formatNombre`, `decimalSeparator`).
- Every word (search, chooser, fullscreen, drawer controls, edit/save/cancel, computed, correction line): required `labels` props, no default.
- Row-navigation guard: reuses the library's `isEditableTarget`.

## Dependencies

Peer dependencies (React convention: one instance in the host): `@heroui/react ^3.2.5`, `ag-grid-community ^36.1.0`, `ag-grid-react ^36.1.0`, `lucide-react ^0.511.0`. They are imported, never bundled.
