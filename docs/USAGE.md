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

## Component catalog

| Category | Components |
|----------|-----------|
| **Atoms** | `MosaicButton` · `MosaicCard` (+ Header/Title/Description/Content/Footer) · `MosaicBadge` · `MosaicAvatar` · `MosaicInput` · `MosaicInputGroup` · `MosaicField` (+ Label/Control/Description/Error) · `MosaicSwitch` · `MosaicSelect` · `MosaicCombobox` · `MosaicDropdownMenu` |
| **Landing blocks** | `MosaicNavbar` · `MosaicHeroSplit` · `MosaicFeatureCenteredMedia` · `MosaicStatsGrid` · `MosaicPricingCard` · `MosaicLogosGrid` · `MosaicTestimonialsGrid` · `MosaicFooterSimple` |
| **Utility blocks** | `MosaicCounter` · `MosaicThemeToggle` · `MosaicBlurredOrb` · `MosaicAnimatedList` · `MosaicIntegrationsBadge` · `MosaicFallingPattern` · `useMediaQuery` |

Per-prop API: each component's `*.tsx` exports a typed `Mosaic*Props` interface; the bundled `dist/index.d.ts` is the source of truth.
