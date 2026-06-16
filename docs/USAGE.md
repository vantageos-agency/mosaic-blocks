# Usage — @vantageos/mosaic-blocks

Two consumption paths: **npm import** (versioned dependency) and **shadcn registry** (copy-paste source you own).

> **Alpha:** not yet published to npm. Paths below describe the published contract (T5 / `0.1.0-alpha.1`).

## 1. npm import

```bash
pnpm add @vantageos/mosaic-blocks
# peer deps you provide: react@19, react-dom@19, tailwindcss@4
```

```tsx
import { MosaicButton, MosaicCard, MosaicSelect } from "@vantageos/mosaic-blocks";

export function Example() {
  return (
    <MosaicCard>
      <MosaicSelect
        items={[{ value: "a", label: "Option A" }]}
        placeholder="Pick one"
        onValueChange={(v) => console.log(v)}
      />
      <MosaicButton variant="secondary">Save</MosaicButton>
    </MosaicCard>
  );
}
```

The package ships ESM + CJS + types. Interactive atoms are client components — render them inside a `"use client"` boundary in the Next.js App Router.

## 2. shadcn registry (copy-paste)

`registry.json` (shadcn schema) exposes each component as a `registry:ui` item, so you can copy the source into your own tree and own it:

```bash
npx shadcn@latest add <registry-url>/mosaic-button
npx shadcn@latest add <registry-url>/mosaic-select
```

Component source paths live under `src/components/<name>/`. Use this path when you want to fork/customize rather than depend on the npm version.

## 3. Theme setup (required)

Components reference semantic OKLCH tokens; register the default token set once at the app root using the shipped stylesheet:

```css
/* app/globals.css */
@import "tailwindcss";
@import "@vantageos/mosaic-blocks/styles.css";
```

This provides 19 semantic OKLCH tokens (`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`) with a light `:root` block and a `[data-theme="dark"]` block. The `@theme inline` block maps every token to Tailwind v4 color utilities automatically.

**Rebrand:** override any `--*` CSS variable after the import — no component changes needed (Rule #2):

```css
@import "tailwindcss";
@import "@vantageos/mosaic-blocks/styles.css";

:root {
  --primary: oklch(0.55 0.2 264); /* swap to your brand color */
}
```

Toggle dark mode with `MosaicThemeToggle` (flips the `data-theme` attribute on `<html>`), or set `data-theme="dark"` on `<html>` yourself. Full model: [ARCHITECTURE.md](./ARCHITECTURE.md#theme-system--oklch-semantic-tokens-no-provider).

## 4. Consuming with Tailwind (REQUIRED)

> **Why this matters:** mosaic-blocks ships as compiled JS that references Tailwind utility classes (`bg-background`, `border-border`, `ring-ring/20`, `text-muted-foreground`, etc.). If your Tailwind build does not scan the lib's published `dist/`, those classes get purged at build time and every component renders completely unstyled — even though your app compiles without errors and no warning is emitted.

The full required setup in one place, ordered correctly:

### Tailwind v4 (CSS-first — `@import "tailwindcss"`)

```css
/* app/globals.css */

/* 1. Import Tailwind v4 */
@import "tailwindcss";

/* 2. REQUIRED: OKLCH semantic token variables (bg-background, ring-ring, …) */
@import "@vantageos/mosaic-blocks/styles.css";

/* 3. REQUIRED: tell Tailwind v4 to scan mosaic-blocks' compiled dist.        */
/*    Place @source after all @import rules (CSS spec: @import must be first). */
/*    Path is relative to THIS CSS file — adjust the leading ../../ depth      */
/*    so the path resolves to your project's node_modules directory.           */
/*    Example: CSS at src/app/globals.css → ../../node_modules/...             */
/*             CSS at app/globals.css      →  ../node_modules/...              */
@source "../../node_modules/@vantageos/mosaic-blocks/dist";
```

> **Resolving the relative `@source` path:** Tailwind v4 resolves `@source` paths relative to the CSS file, not to the project root. Count how many directory levels up from your CSS file you need to reach the root where `node_modules` lives, then suffix with `/@vantageos/mosaic-blocks/dist`. With pnpm, the path through `node_modules/@vantageos/mosaic-blocks` (the shallow symlink) is sufficient — Tailwind follows symlinks into the `.pnpm` store automatically.

### Tailwind v3 (`tailwind.config.js` / `tailwind.config.ts`)

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    // REQUIRED: scan mosaic-blocks compiled dist so utility classes are not purged
    "./node_modules/@vantageos/mosaic-blocks/dist/**/*.{js,mjs,cjs}",
  ],
  // ... rest of config
};
```

Then import the theme tokens in your global CSS:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* REQUIRED: OKLCH semantic variables consumed by all mosaic-blocks components */
@import "@vantageos/mosaic-blocks/styles.css";
```

### Verify the wiring worked

After wiring, run a real build (`next build`) and grep the emitted CSS for a lib-only class such as `ring-ring` or `bg-card`:

```bash
# Tailwind v4 — emitted CSS is in .next/static/chunks/*.css
grep -rho "ring-ring[^ }]*" .next/static 2>/dev/null | head
grep -rho "bg-card[^ }]*"   .next/static 2>/dev/null | head

# Tailwind v3 — the merged CSS file is usually .next/static/css/*.css
grep -rho "ring-ring[^ }]*" .next/static/css 2>/dev/null | head
```

If the grep returns nothing, the `@source` path or `content` glob is not matching the lib's dist — check the relative path depth and rebuild.

> Tracked as fix-pattern **m977rhgv** — 2 consumers (vantageos-crm #105, vantage-peers-dashboard #12) missed this before it was documented.

## Component catalog

| Category | Components |
|----------|-----------|
| **Atoms** | `MosaicButton` · `MosaicCard` (+ Header/Title/Description/Content/Footer) · `MosaicBadge` · `MosaicAvatar` · `MosaicInput` · `MosaicInputGroup` · `MosaicField` (+ Label/Control/Description/Error) · `MosaicSwitch` · `MosaicSelect` · `MosaicCombobox` · `MosaicDropdownMenu` |
| **Landing blocks** | `MosaicNavbar` · `MosaicHeroSplit` · `MosaicFeatureCenteredMedia` · `MosaicStatsGrid` · `MosaicPricingCard` · `MosaicLogosGrid` · `MosaicTestimonialsGrid` · `MosaicFooterSimple` |
| **Utility blocks** | `MosaicCounter` · `MosaicThemeToggle` · `MosaicBlurredOrb` · `MosaicAnimatedList` · `MosaicIntegrationsBadge` · `MosaicFallingPattern` · `useMediaQuery` |

Per-prop API: each component's `*.tsx` exports a typed `Mosaic*Props` interface; the bundled `dist/index.d.ts` is the source of truth.
