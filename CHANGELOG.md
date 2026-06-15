# Changelog

All notable changes to `@vantageos/mosaic-blocks` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added — T3-A Batch A: 8 landing-section blocks (2026-06-15)

Eight production-ready landing page section blocks ported from heyfabrika/styleui (MIT).
All blocks are fully props-driven — zero hardcoded branding, colors, copy, or logos.
OKLCH CSS tokens throughout (no pure `#000`/`#fff`).
RED-first TDD: 35 new tests (8 new test files), 100% passing.

| Block | Props API (key props) |
|-------|-----------------------|
| `MosaicNavbar` | `logo`, `links[]`, `cta?` — scroll-aware hide-on-scroll-down, mobile menu |
| `MosaicHeroSplit` | `title`, `subtitle`, `eyebrow?`, `cta?`, `ctaSecondary?`, `media?` |
| `MosaicFeatureCenteredMedia` | `title`, `body`, `features[]?`, `media?` |
| `MosaicStatsGrid` | `stats[] {label, value}`, `heading?`, `subtext?` |
| `MosaicPricingCard` | `tier`, `price`, `features[]`, `cta`, `highlighted?` |
| `MosaicLogosGrid` | `logos[] {name, src, width?, height?}`, `heading?` |
| `MosaicTestimonialsGrid` | `testimonials[] {id, quote, author, role, avatar?, logo?}`, `heading?` |
| `MosaicFooterSimple` | `columns[] {id, heading, links[]}`, `legal`, `logo?`, `social[]?` |

**New dependencies:** none — motion/react intentionally excluded (CSS transitions used
instead for bundle budget). Native `<img>` used (lib-portable; wrap with `next/image`
at consumer level).

**Gates (all green):**
- `pnpm test`: 38/38 (10 files)
- `pnpm typecheck`: 0 errors
- `pnpm lint` (biome): 0 errors
- `pnpm build` (tsup ESM+CJS+DTS): success
- `pnpm sandbox:build` (Next.js 16): static / 0 errors

### Added — Documentation (2026-06-15)

- `docs/ARCHITECTURE.md` — library layers, @base-ui/react foundation, OKLCH theme system (consumer-provided semantic tokens, `data-theme` dark mode, planned `styles.css` export), distribution model.
- `docs/USAGE.md` — npm + shadcn-registry consumption, required theme setup, full component catalog.
- `docs/CONTRIBUTING.md` — TDD RED-first workflow, local + CI gates, naming/theming conventions, docs-sync obligation.
- `README.md` — added Documentation index (relative links), Install section, and a component Catalog table with per-batch ship status.

### Added — T3-B Batch B: 6 utility blocks + useMediaQuery (2026-06-15)

6 utility blocks + 1 hook ported from heyfabrika/styleui (MIT). All theme-reactive via OKLCH CSS vars. Zero hardcoded branding. Zero new runtime dependencies.

- `MosaicCounter` — animated metric count-up via requestAnimationFrame (easeOutExpo). Props: `value`, `duration?`, `format?`. Respects `prefers-reduced-motion`.
- `MosaicThemeToggle` — light/dark/system theme toggle. Flips `data-theme` on `document.documentElement`. Props: `themes?`, `onChange?`, `label?`.
- `MosaicBlurredOrb` — decorative blurred gradient orb. Pure CSS (`filter: blur`). Props: `colors?`, `size?`, `position?`, `blur?`, `opacity?`. `aria-hidden`.
- `MosaicAnimatedList` — staggered reveal list via CSS keyframe + inline `animation-delay`. Props: `stagger?`, `children`, `as?`. Respects `prefers-reduced-motion`.
- `MosaicIntegrationsBadge` — integration pill badge. Renders as `<a>` when `href` provided. Props: `label`, `logo?`, `href?`, `target?`.
- `MosaicFallingPattern` — animated dot-grid background (SVG pattern + CSS falling dot animation). Props: `density?`, `color?`, `animationDuration?`. `aria-hidden`.
- `useMediaQuery(query): boolean` — SSR-safe media query hook; subscribes via `addEventListener("change")` in effect only.

**Bundle decision:** `motion` (framer-motion) evaluated and rejected — all animations achievable with native rAF + CSS keyframes. 0 new runtime deps. Registry: 6 blocks added. Tests: RED-first, 25 new.

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

- `README.md`: Added MosaicButton usage, @base-ui/react rationale, ADR-0001 link, CI badge + gates table, Batch A blocks section.

---

## [0.1.0-alpha.0] — 2026-06-10

### Added

- T1 bootstrap: build infra (tsup ESM+CJS+DTS), vitest test harness, Next.js 16 sandbox, biome linter, versions.ts catalog, sync-versions script, versions drift guard.
- `src/versions.ts` — pinned-dependency catalog (pattern from awslabs/nx-plugin-for-aws, Apache 2.0).
- `scripts/sync-versions.mjs` — propagates catalog to all package.json files.
- `src/versions.test.ts` — drift guard (CI catches package.json drift).
- `Placeholder` component (scaffold — removed when T3 lands real blocks).

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
