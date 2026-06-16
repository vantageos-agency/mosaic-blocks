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

## Consuming with Tailwind (REQUIRED)

> **Why this matters:** mosaic-blocks ships as compiled JS that references Tailwind utility classes (`bg-background`, `border-border`, `ring-ring/20`, etc.). If your Tailwind build does not scan the lib's published `dist/`, those classes get purged and components render completely unstyled — even though your app compiles without errors.

You must tell your Tailwind build to scan the lib's dist. The full required setup in one place:

### Tailwind v4 (CSS-first — `@import "tailwindcss"`)

In your `app/globals.css` (or equivalent), add an `@source` directive **after** all `@import` rules (CSS spec: `@import` must precede other at-rules):

```css
/* app/globals.css */
@import "tailwindcss";

/* REQUIRED: OKLCH semantic token variables consumed by all mosaic-blocks components */
@import "@vantageos/mosaic-blocks/styles.css";

/* REQUIRED: tell Tailwind v4 to scan the lib's dist for utility classes.     */
/* Place @source after all @import rules (CSS spec: @import must come first).  */
/* Path is relative to THIS CSS file — adjust the leading ../../ depth         */
/* so it points at your project's node_modules directory.                      */
@source "../../node_modules/@vantageos/mosaic-blocks/dist";
```

> **Resolving the relative path:** count how many directories deep your CSS file is from the project root. If `globals.css` is at `src/app/globals.css` → use `../../node_modules/...`. If it is at `app/globals.css` (one level) → use `../node_modules/...`.

### Tailwind v3 (`tailwind.config.js` / `tailwind.config.ts`)

Add the glob to the `content` array:

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    // REQUIRED: scan mosaic-blocks compiled dist so utility classes are not purged
    "./node_modules/@vantageos/mosaic-blocks/dist/**/*.{js,mjs,cjs}",
  ],
  // ... rest of config
};
```

Then import the theme tokens in your CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
/* REQUIRED: OKLCH semantic tokens used by all mosaic-blocks components */
@import "@vantageos/mosaic-blocks/styles.css";
```

### Verify it worked

After wiring, run a real build (`next build`) and grep the emitted CSS for a **library-only** class — `data-[popup-open]:ring-ring`, which only mosaic-blocks' compiled `@base-ui` components emit, so a match proves the dist glob is wired:

```bash
# Tailwind v4 — the .css chunk lives under .next/static/chunks/
grep -rho "data-\[popup-open\]:ring-ring[^ }]*" .next/static 2>/dev/null | head
# other lib-only discriminators you can probe instead:
#   data-\[checked\]:bg-foreground   data-\[highlighted\]:bg-accent
```

> **Don't probe with a plain semantic class** (`bg-card`, `ring-ring`, `text-muted-foreground`) — consumers usually use those in their own markup, so they generate regardless and give a false pass. A `data-[…]:` variant only appears in mosaic-blocks' compiled components.

If the grep returns nothing, the `@source` path or `content` glob is not matching the dist — fix the path and rebuild.

> Tracked as fix-pattern **m977rhgv** — 2 consumers (vantageos-crm #105, vantage-peers-dashboard #12) missed this before it was documented.

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

## Blocks

### T3-B Batch B — Utility Blocks (2026-06-15)

| Block | Description | Extra deps |
|-------|-------------|------------|
| `MosaicCounter` | Animated metric count-up (rAF, easeOutExpo) | none |
| `MosaicThemeToggle` | Light/dark/system toggle via `data-theme` | none |
| `MosaicBlurredOrb` | Decorative blurred gradient orb (CSS filter) | none |
| `MosaicAnimatedList` | Staggered reveal list (CSS keyframe stagger) | none |
| `MosaicIntegrationsBadge` | Integration pill badge with logo slot | none |
| `MosaicFallingPattern` | Animated dot-grid background (SVG + CSS) | none |

**Hook:** `useMediaQuery(query): boolean` — SSR-safe, subscribes in effect only.

**Bundle:** 0 new runtime dependencies added. `motion` evaluated and rejected — all animations achievable with native rAF + CSS keyframes.

## Status

T3-B Batch B complete. T1 bootstrap (build infra) was the foundation. Consumed by VP Cloud (Sigma) and vCRM Cloud (Theta).

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
