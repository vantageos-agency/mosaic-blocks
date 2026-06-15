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

Components reference semantic OKLCH tokens; you must register them once at the app root.

> **T5:** `@import "@vantageos/mosaic-blocks/styles.css";` will provide the default token set. Until then, declare them yourself:

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary:    var(--primary);
  /* …map the full shadcn token set… */
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0 0);
  --primary:    oklch(0.55 0.2 264);
  /* … */
}
[data-theme="dark"] {
  --background: oklch(0.15 0 0);
  --foreground: oklch(0.98 0 0);
  /* … */
}
```

Toggle dark mode with `MosaicThemeToggle` (flips the `data-theme` attribute on `<html>`), or set it yourself. Rebrand by overriding any `--*` variable — no component changes (Rule #2). Full model: [ARCHITECTURE.md](./ARCHITECTURE.md#theme-system--oklch-semantic-tokens-no-provider).

## Component catalog

| Category | Components |
|----------|-----------|
| **Atoms** | `MosaicButton` · `MosaicCard` (+ Header/Title/Description/Content/Footer) · `MosaicBadge` · `MosaicAvatar` · `MosaicInput` · `MosaicInputGroup` · `MosaicField` (+ Label/Control/Description/Error) · `MosaicSwitch` · `MosaicSelect` · `MosaicCombobox` · `MosaicDropdownMenu` |
| **Landing blocks** | `MosaicNavbar` · `MosaicHeroSplit` · `MosaicFeatureCenteredMedia` · `MosaicStatsGrid` · `MosaicPricingCard` · `MosaicLogosGrid` · `MosaicTestimonialsGrid` · `MosaicFooterSimple` |
| **Utility blocks** | `MosaicCounter` · `MosaicThemeToggle` · `MosaicBlurredOrb` · `MosaicAnimatedList` · `MosaicIntegrationsBadge` · `MosaicFallingPattern` · `useMediaQuery` |

Per-prop API: each component's `*.tsx` exports a typed `Mosaic*Props` interface; the bundled `dist/index.d.ts` is the source of truth.
