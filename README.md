# @vantageos/mosaic-blocks

[![CI](https://github.com/vantageos-agency/mosaic-blocks/actions/workflows/ci.yml/badge.svg)](https://github.com/vantageos-agency/mosaic-blocks/actions/workflows/ci.yml)

**Alpha — not yet published. PRs gated by CI — all 7 gates must be green before merge.**

React "composed" blocks for VantageOS products. Distinct from `@vantageos/mosaic` (cross-runtime atoms): this library is React-only and targets full composed UI blocks.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, @base-ui foundation, OKLCH theme system, distribution.
- [docs/USAGE.md](docs/USAGE.md) — consume via npm + shadcn registry, theme setup, full component catalog.
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — TDD workflow, local + CI gates, conventions.
- [docs/adr/0001-base-ui-vs-radix.md](docs/adr/0001-base-ui-vs-radix.md) — ADR: @base-ui/react vs Radix.
- [CHANGELOG.md](CHANGELOG.md) — release notes.

## Install

```bash
pnpm add @vantageos/mosaic-blocks   # alpha — not yet published; see docs/USAGE.md
# peer deps: react@19, react-dom@19, tailwindcss@4
```

Theme tokens (OKLCH semantic CSS variables) are consumer-provided at the app root — see [docs/USAGE.md](docs/USAGE.md#3-theme-setup-required).

## Stack

- Next.js 16 + React 19
- Tailwind v4 (OKLCH design tokens)
- **@base-ui/react** (headless interactive atoms — see [ADR-0001](docs/adr/0001-base-ui-vs-radix.md))
- class-variance-authority (variant management)
- shadcn registry protocol

## Interactive Atoms — @base-ui/react (ADR-0001)

All interactive Batch C atoms use `@base-ui/react` as the headless primitive layer.
Decision rationale, per-primitive availability table, and risk register: [`docs/adr/0001-base-ui-vs-radix.md`](docs/adr/0001-base-ui-vs-radix.md).

**Why @base-ui/react, not Radix?**
- Source (`heyfabrika/styleui`) is 100% @base-ui — near-zero porting effort.
- React 19 native; `data-slot` API aligns with our Tailwind v4 selectors.
- shadcn's stated future reference; forward-compatible with registry format.
- No existing Radix investment to preserve.

## Components

### MosaicButton

```tsx
import { MosaicButton } from "@vantageos/mosaic-blocks";

// Variants: default | secondary | ghost | destructive | outline | link
// Sizes:    default | sm | lg | icon | icon-sm | icon-lg

<MosaicButton variant="secondary" size="lg">Save changes</MosaicButton>
<MosaicButton variant="destructive" disabled>Delete account</MosaicButton>
<MosaicButton variant="ghost" size="icon" aria-label="Add item">+</MosaicButton>
```

Built on `@base-ui/react/button`. Headless, accessible (role=button, keyboard nav, focus management). `data-slot="button"` for Tailwind `in-data-[slot=...]` selectors. Forwards `ref` to the underlying `<button>` element.

### Catalog

Full prop APIs in [docs/USAGE.md](docs/USAGE.md#component-catalog). Ship status reflects merge state into `main`:

| Category | Components | Status |
|----------|-----------|--------|
| **Atoms** (Batch C) | Button · Card · Badge · Avatar · Input · InputGroup · Field · Switch · Select · Combobox · DropdownMenu | Button shipped; rest in review (PR #6) |
| **Landing blocks** (Batch A) | Navbar · HeroSplit · FeatureCenteredMedia · StatsGrid · PricingCard · LogosGrid · TestimonialsGrid · FooterSimple | in review (PR #2) |
| **Utility blocks** (Batch B) | Counter · ThemeToggle · BlurredOrb · AnimatedList · IntegrationsBadge · FallingPattern · `useMediaQuery` | in review (PR #3) |

All components are `Mosaic`-prefixed, props-driven, OKLCH theme-reactive, and branding-swappable.

## CI Gates

Every PR runs 7 hard-failing gates (no `continue-on-error`). All must pass before merge:

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

### Batch A — Landing section blocks

T3-A Batch A shipped. 8 landing-section blocks available — see CHANGELOG for the full list.

| Block | Props summary |
|-------|--------------|
| `MosaicNavbar` | `logo`, `links[]`, `cta?` — scroll-aware, mobile menu |
| `MosaicHeroSplit` | `title`, `subtitle`, `eyebrow?`, `cta?`, `media?` |
| `MosaicFeatureCenteredMedia` | `title`, `body`, `features[]?`, `media?` |
| `MosaicStatsGrid` | `stats[] {label, value}`, `heading?` |
| `MosaicPricingCard` | `tier`, `price`, `features[]`, `cta`, `highlighted?` |
| `MosaicLogosGrid` | `logos[] {name, src}`, `heading?` |
| `MosaicTestimonialsGrid` | `testimonials[] {id, quote, author, role}`, `heading?` |
| `MosaicFooterSimple` | `columns[]`, `legal`, `logo?`, `social[]?` |

All blocks: zero hardcoded branding — all content via props. OKLCH color tokens.

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
pnpm lint           # biome check (0 errors)
pnpm typecheck      # tsc --noEmit (0 errors)
pnpm test           # vitest run (all pass)
pnpm parse-guard    # TS compiler API syntax check (scripts/parse-guard.mjs)
pnpm build          # tsup → dist/ (ESM + CJS + DTS)
pnpm sandbox:build  # next build inside sandbox/ (MosaicButton rendered)
```

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
