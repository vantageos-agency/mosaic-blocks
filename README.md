# @vantageos/mosaic-blocks

**Alpha — not yet published.**

React "composed" blocks for VantageOS products. Distinct from `@vantageos/mosaic` (cross-runtime atoms): this library is React-only and targets full composed UI blocks.

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

## Gates

```
pnpm lint           # biome check (0 errors)
pnpm typecheck      # tsc --noEmit (0 errors)
pnpm test           # vitest run (all pass)
pnpm build          # tsup → dist/ (ESM + CJS + DTS)
pnpm sandbox:build  # next build inside sandbox/ (MosaicButton rendered)
```

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
