# gamma-docs-counts-masked-exports — extractRealExports masks comments itself

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/docs-counts-masked-exports
**Task:** k17bbzm6t33ardm0bc7vwsy3918jtbx7
**Author:** Gamma — VantageOS Team | 2026-11-24

## Summary

`extractRealExports` matched regexes over the raw text of `src/index.ts` when called from `scripts/docs-counts.mjs` and two tests, so an `export { X } from "./x";` inside a `//` comment, a block comment or a JSDoc was counted and the README counts moved. The function now masks comments, regex literals and string content itself (length-preserving), so no caller can pass text that makes a comment count.

## Changes

- `scripts/docs-counts-shared.mjs` (+ `.d.mts`): `extractRealExports` masks before matching; parameter renamed `rawSource`.
- `scripts/registry-json-derive.mjs`: caller-side mask removed (redundant; output unchanged).
- `src/__tests__/no-lying-prop-contract.test.ts`: its own copy of the barrel regex now reads comment-masked text.
- `src/__tests__/docs-counts-export-domain.test.ts`: one mutation per comment form, positive pole, idempotence, line number.
