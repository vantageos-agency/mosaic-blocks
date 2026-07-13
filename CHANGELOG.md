# Changelog

All notable changes to `@vantageos/mosaic-blocks` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added — 0.5.17-alpha

**MosaicResizableSplitPane** (`src/components/resizable-split-pane/`) — presentational resizable two-pane content layout. Forms a pair with `MosaicPdfViewer`: replaces the modal document-preview pattern (see document OR edit fields, never both) with a draggable side-by-side split. Props: `main`, `side` (both `React.ReactNode`), `sideWidth?`/`onSideWidthChange?` (host-controlled percentage), `isSideCollapsed?`/`onToggleSideCollapsed?`, required `collapseButtonAriaLabel` + `resizeHandleAriaLabel` (no default). Resize via pointer drag on the handle or `ArrowLeft`/`ArrowRight` on the keyboard-focusable `role="separator"` handle (`aria-orientation="vertical"`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`). No split-pane library dependency. 17 TDD tests, including a mutation-proven `pointermove`/`pointerup` listener-cleanup-on-unmount test.

### Changed — Tech Debt (DETTE A + B)

**DETTE A — react-doctor allow-list for 3 cva/compound false-positives (config only)**
Added `react-doctor.config.json` with an `ignore.overrides` entry that scopes the `react-doctor/only-export-components` rule to three files that legitimately export non-component utilities alongside components:
- `src/components/button/Button.tsx` — `buttonVariants` (cva helper, public API)
- `src/components/badge/MosaicBadge.tsx` — `badgeVariants` (cva helper, public API)
- `src/components/field/MosaicField.tsx` — `MosaicField` compound via `Object.assign`

These are deliberate library patterns, not fast-refresh violations. The config uses the per-file, per-rule `ignore.overrides` mechanism (see react-doctor config schema). Zero component source files were edited; zero other rules or files were suppressed. Full-scan `only-export-components` errors: 3 → 0.

**DETTE B — MosaicField ref-forwarding test**
Added one unit test to `src/components/field/MosaicField.test.tsx` proving the React-19 ref-as-prop pattern forwards a ref through `MosaicField` (root) to the underlying `<div>` DOM element. Mirrors the ref-forwarding test style from `Button.test.tsx` and `MosaicInput.test.tsx`. Test count: 167 → 168.

### Added — T4 (rescoped Option A)

Two net-new deliverables landing in this wave. Four additional patterns (MosaicNavbar, MosaicStatsGrid, MosaicLogosGrid-static, MosaicPricingCard) were already shipped in Batch A and are subsumed here by reference.

**MosaicFeature3Col** (`src/components/feature-3col/`) — new 3-column feature grid section, distinct from the existing `MosaicFeatureCenteredMedia` (which is a single centered layout with media slot). Props: `heading?`, `subtext?`, `features: Feature3ColItem[]` (each item: `id`, `title`, `body`, `icon?`). Responsive: 1 column on mobile, 3 columns at `md+`. Optional icon slot per cell. `data-slot="feature-3col"` on root `<section>`, `data-slot="feature-3col-item"` on each cell. React-19 ref-as-prop. OKLCH semantic tokens only. 8 TDD tests.

**MosaicLogosGrid stagger-motion variant** — opt-in `stagger?: boolean | number` prop added to the existing `MosaicLogosGrid` (DRY, no new component). When truthy, logos animate in with a CSS keyframe staggered reveal (`mosaic-logo-in`), applying per-item `animation-delay` increasing by `stagger` ms (or 80ms default when `true`). Fully backward-compatible: existing behavior is preserved when `stagger` is omitted. Respects `prefers-reduced-motion: reduce` — no animation or delay applied when set. Same keyframe injection pattern as `MosaicAnimatedList`. 4 new TDD tests.

### Changed

- **MosaicLogosGrid stagger keyframe** (`mosaic-logo-in`) now ships statically in `styles.css` instead of runtime injection (cleaner SSR, no runtime `<style>` insertion). Stagger requires importing `@vantageos/mosaic-blocks/styles.css` (already required for theming).
- **MosaicFeature3Col** icon-slot now uses `size-10` Tailwind shorthand instead of separate `h-10 w-10`. Behavior identical.
- Added MIT LICENSE file (backs package.json license:MIT); corrected package description (no longer "not yet published"). Ships in next publish — 0.1.0-alpha.1 already live, no republish.

## [0.1.0-alpha.1] — 2026-06-15

### Added

- Shippable `@vantageos/mosaic-blocks/styles.css` default OKLCH token set: 19 semantic tokens (`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`), light `:root` block + dark `[data-theme="dark"]` block, `@theme inline` Tailwind v4 mapping for all 19 tokens, branding-swappable via var override per Rule #2.
- npm publish wiring: `"private": true` removed, `"license": "MIT"`, `"publishConfig": { "access": "public" }`, `repository` + `homepage` fields, `"./styles.css": "./dist/styles.css"` export entry.
- `scripts/copy-assets.mjs`: copies `src/styles.css` → `dist/styles.css` as part of the `build` script.
- Sandbox (`sandbox/src/app/globals.css`) now imports `@vantageos/mosaic-blocks/styles.css` — export exercised by `sandbox:build`.

### Added — T3-C Batch C: 10 base-ui atoms (2026-06-15)

Ten interactive/static atoms ported onto `@base-ui/react@1.5.0` primitives, completing the
11-atom Batch C set (MosaicButton shipped in T0-ARCH). All props-driven, OKLCH theme-reactive,
branding-swappable, `data-slot` API. RED-first TDD: 82 new tests across 10 files, 100% passing.

| Atom | Primitive | Notes |
|------|-----------|-------|
| `MosaicCard` (+Header/Title/Description/Content/Footer) | style-only | composable surface |
| `MosaicBadge` | style-only | cva: default/secondary/destructive/outline |
| `MosaicAvatar` | `@base-ui/react/avatar` | image + fallback |
| `MosaicInput` | `@base-ui/react/input` | ref → native input |
| `MosaicInputGroup` | composition | prefix/suffix addons |
| `MosaicField` (+Label/Control/Description/Error) | `@base-ui/react/field` | wired a11y associations |
| `MosaicSwitch` | `@base-ui/react/switch` | controlled + uncontrolled, role=switch |
| `MosaicSelect` | `@base-ui/react/select` | items[] API, keyboard nav |
| `MosaicCombobox` | `@base-ui/react/combobox` | useFilter "contains", native in 1.5.0 |
| `MosaicDropdownMenu` | `@base-ui/react/menu` | trigger + items[], keyboard nav |

**base-ui 1.5.0 API notes:** `onValueChange` receives `(value, eventDetails)` (value can be `null`);
`Field.Error` renders `<div>` with `match` prop; `Select.Value` needs a render child for label mapping;
`Menu.Trigger` uses `render` prop (not `asChild`); `Switch.Root` dispatches PointerEvent (tests use keyboard).

**Gates (all green):** test 98/98 (13 files) · typecheck 0 · biome 0 · tsup ESM+CJS+DTS · sandbox:build static (Rule #19).

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
