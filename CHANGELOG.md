# Changelog

All notable changes to `@vantageos/mosaic-blocks` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added — T1.5 CI Workflow (2026-06-15)

Hard-failing GitHub Actions CI workflow (`.github/workflows/ci.yml`) — all 7 gates, no `continue-on-error`. Runs on every PR and push to `main`.

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

### Added — T0-ARCH: @base-ui/react adoption + MosaicButton spike

- **ADR-0001** (`docs/adr/0001-base-ui-vs-radix.md`): Architecture Decision Record adopting `@base-ui/react` as the headless primitive layer for Batch C interactive atoms. Documents rationale, per-primitive availability across all 11 Batch C atoms, risks, and consequences.
- **MosaicButton** (`src/components/button/Button.tsx`): First production interactive atom. Built on `@base-ui/react/button`. Six variants (default, secondary, ghost, destructive, outline, link), six sizes (default, sm, lg, icon, icon-sm, icon-lg). `data-slot="button"`, forwardRef, accessible by default.
- **MosaicButton test suite** (`src/components/button/Button.test.tsx`): 10 RED-first TDD tests. Covers render, variant classes, click handler, ref forwarding, disabled state, `data-slot` attribute.
- **registry.json**: Added `mosaic-button` entry in shadcn registry format.
- **sandbox/src/app/page.tsx**: Renders MosaicButton variants/sizes/states so `sandbox:build` exercises the component (Rule #19).
- **class-variance-authority** (`^0.7.1`): Added as production dependency for variant management.
- **@testing-library/user-event**: Added as dev dependency for click interaction tests.
- `src/versions.ts`: Added `class-variance-authority` version entry.

### Changed

- `README.md`: Added MosaicButton usage, @base-ui/react rationale, ADR-0001 link, CI badge + gates table.

---

## [0.1.0-alpha.0] — 2026-06-10

### Added

- T1 bootstrap: build infra (tsup ESM+CJS+DTS), vitest test harness, Next.js 16 sandbox, biome linter, versions.ts catalog, sync-versions script, versions drift guard.
- `Placeholder` component (scaffold — removed when T3 lands real blocks).

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
