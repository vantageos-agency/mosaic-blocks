# Changelog

All notable changes to `@vantageos/mosaic-blocks` are documented here.

## [Unreleased]

### Added — T1.5 CI Workflow (2026-06-15)

Hard-failing GitHub Actions CI workflow (`.github/workflows/ci.yml`) — all 8 gates, no `continue-on-error`. Runs on every PR and push to `main`.

**Gates:**
1. Lint — Biome, 0 warnings.
2. Typecheck — `tsc --noEmit`, 0 errors.
3. Tests — Vitest, all green.
4. Parse guard — `scripts/parse-guard.mjs` via TypeScript compiler API `parseDiagnostics`. Exits non-zero on any syntax/parse error. Mirrors vantage-immo #89 bundleGuard pattern (fix-pattern m978csm3).
5. Build — tsup ESM+CJS+DTS.
6. Sandbox build — `next build` inside `sandbox/` (Rule #19).
7. React-doctor — `react-doctor@0.2.11` (pinned, NEVER @latest) with `--diff origin/main --fail-on error --annotations`. Dimension 12 in CI.

**Scripts added:** `pnpm parse-guard` (`node scripts/parse-guard.mjs`).

**Action pins:** `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`. pnpm store cached via `setup-node` built-in cache.

**README:** CI badge added. Gates table added.

---

### Added — T1 Bootstrap (initial)

Build infrastructure: tsup ESM+CJS+DTS, Vitest, Biome, Next.js 16 sandbox, `versions.ts` catalog with drift guard.
