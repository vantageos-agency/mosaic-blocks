# gamma-registre-pagination-locale — GrilleRegistre pagination and localeText

**Version:** derived after merge (the release-artifacts guard forbids a version bump in a component PR)
**Branch:** gamma/registre-pagination-locale
**Author:** Gamma — VantageOS Team | 2026-11-22

## Summary

`GrilleRegistre` forwards four optional AG Grid options, so a registry screen that pages its rows and translates the grid's own UI text can mount the shared grid instead of a private one.

## GrilleRegistre additions

- `pagination?: boolean` -> AG Grid `pagination`.
- `paginationPageSize?: number` -> `paginationPageSize`.
- `paginationPageSizeSelector?: number[] | boolean` -> `paginationPageSizeSelector`.
- `localeText?: Record<string, string>` -> `localeText`, keyed by AG Grid locale key. Generic and host-supplied, like `messageVide`.

Omitted, each option is left to AG Grid, whose defaults are unchanged. The declaration change is additive only.
