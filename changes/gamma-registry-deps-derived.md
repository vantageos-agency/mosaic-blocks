# gamma-registry-deps-derived — registry items carry the dependencies their files import

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/registry-deps-derived
**Author:** Gamma — VantageOS Team | 2026-11-22

## Summary

`scripts/registry-json-derive.mjs` derived each item's dependencies from its files' imports but kept the saved `dependencies` of any item already in `registry.json`. The saved lists had gone stale: on `origin/main` @ e735ce0, 52 of 140 items differed from their imports. The deriver now always writes the derived list, and `--check` names any item whose saved list differs.

## Measurement

New test in `src/__tests__/registry-json-derive-dependencies.test.ts`: for every item of `registry.json`, compare the saved `dependencies` with `dependenciesOfFiles` over the item's files (the scanner masks comments and strings, so a package named only in a comment does not count).

- Before: `52 of 140 items diverge` — 44 omit `class-variance-authority`, `mosaic-document-table` omits `ag-grid-community`, 7 list `@clerk/nextjs`, `@vantageos/cloud-identity` or `next-themes` that appear only in comments.
- After: 0.

## Changes

- `scripts/registry-json-derive.mjs`: `dependencies` = the derivation for every item; `--check` reports `DEPENDENCIES differ from the items' real imports: <slug> (saved […], derived […])`.
- `scripts/tests/probe-registry-json-derive.sh`: one mutation per drift form on a real item (a missing package on `mosaic-tool-toggle-list`, an extra one on `mosaic-theme-provider`); `--check` must exit non-zero naming the item.
- `registry.json`: regenerated with `pnpm registry:derive`; `cmp registry.json <(node scripts/registry-json-derive.mjs --stdout)` -> EQUAL.
- `r/*.json`: the 52 affected items regenerated with `pnpm build:registry-items` at the current package version; only `dependencies` changes; `pnpm check:registry-items-drift` -> 0 drift.
- `src/components/tool-toggle-list/MosaicToolToggleList.test.tsx`: the approval option is awaited with `findByRole`. base-ui Select opens on `mousedown` inside `requestAnimationFrame`; the synchronous `getByRole` after `user.click` raced that frame.
