# @vantageos/mosaic-blocks

[![CI](https://github.com/vantageos-agency/mosaic-blocks/actions/workflows/ci.yml/badge.svg)](https://github.com/vantageos-agency/mosaic-blocks/actions/workflows/ci.yml)

**Alpha — not yet published. PRs gated by CI — all 8 gates must be green before merge.**

React "composed" blocks for VantageOS products. Distinct from `@vantageos/mosaic` (cross-runtime atoms): this library is React-only and targets full composed UI blocks.

## Stack

- Next.js 16 + React 19
- Tailwind v4 (OKLCH design tokens)
- @base-ui-components/react
- shadcn registry protocol

## Status

T1 bootstrap (build infra only). Real blocks land in T3/T4. Consumed by VP Cloud (Sigma) and vCRM Cloud (Theta).

## CI Gates

Every PR runs 8 hard-failing gates (no `continue-on-error`). All must pass before merge:

| # | Gate | Tool |
|---|------|------|
| 1 | Lint | Biome — 0 warnings |
| 2 | Typecheck | tsc --noEmit — 0 errors |
| 3 | Tests | Vitest — all green |
| 4 | Parse guard | TS compiler API — syntax errors exit 1 |
| 5 | Build | tsup ESM+CJS+DTS |
| 6 | Sandbox build | Next.js build (Rule #19) |
| 7 | React-doctor | react-doctor@0.2.11 --fail-on error (Dimension 12) |

Run locally:

```
pnpm lint
pnpm typecheck
pnpm test
pnpm parse-guard
pnpm build
pnpm sandbox:build
```

## Dependency version catalog (`versions.ts`)

`src/versions.ts` is the single source of truth for every pinned dependency version used across the lib package (`package.json`) and the Next.js sandbox (`sandbox/package.json`).

Pattern adapted from [awslabs/nx-plugin-for-aws](https://github.com/awslabs/nx-plugin-for-aws) (Apache 2.0).

**Why** — DRY: one edit propagates to both package.json files, and to any future scaffolds (CLI templates, Storybook host, etc.) that consume the catalog. No version drift between lib and sandbox.

**How to update a dep version**

```
# 1. Edit the version string in src/versions.ts
# 2. Propagate to all package.json files
pnpm sync-versions
# 3. Reinstall if needed, then commit both files
pnpm install
git add src/versions.ts package.json sandbox/package.json
```

**Drift guard** — `src/versions.test.ts` (vitest) asserts that every catalog-managed key in both `package.json` files matches `versions.ts`. The test fails on drift, which means CI catches any manual edit to a `package.json` that wasn't reflected in the catalog (or vice versa).

## Gates (local commands)

```
pnpm lint           # biome check
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run
pnpm parse-guard    # TS compiler API syntax check (scripts/parse-guard.mjs)
pnpm build          # tsup → dist/
pnpm sandbox:build  # next build inside sandbox/
```

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
