# Architecture — @vantageos/mosaic-blocks

How the library is built and why. For consumption see [USAGE.md](./USAGE.md); for contributing see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Scope

`@vantageos/mosaic-blocks` is the **React-only composed-blocks** library for VantageOS products. It is distinct from `@vantageos/mosaic` (the cross-runtime React + Preact *atoms* library): this package targets full composed UI blocks and React-19-only interactive atoms, and is free to depend on React-specific primitives.

Three layers ship here:

| Layer | Examples | Built on |
|-------|----------|----------|
| **Interactive atoms** (Batch C) | Button, Input, Select, Combobox, Switch, Field, Avatar, DropdownMenu, Card, Badge, InputGroup | `@base-ui/react` headless primitives |
| **Landing blocks** (Batch A) | Navbar, HeroSplit, FeatureCenteredMedia, StatsGrid, PricingCard, LogosGrid, TestimonialsGrid, FooterSimple | composed, props-driven |
| **Utility blocks** (Batch B) | Counter, ThemeToggle, BlurredOrb, AnimatedList, IntegrationsBadge, FallingPattern | composed; CSS/rAF (no motion lib) |

## Headless primitive layer — @base-ui/react

All interactive atoms are built on [`@base-ui/react`](https://base-ui.com) rather than Radix. Full rationale, per-primitive availability matrix, and risk register: [`adr/0001-base-ui-vs-radix.md`](./adr/0001-base-ui-vs-radix.md).

Summary: the upstream source (`heyfabrika/styleui`, MIT) is 100% `@base-ui`, so porting cost is near zero; `@base-ui` is React-19-native; its `data-slot` API aligns with our Tailwind v4 selectors; and it is shadcn's stated future reference.

### data-slot convention

Every atom sets `data-slot="<name>"` on its root DOM node. This lets consumers target internals with Tailwind v4 `in-data-[slot=...]` / `[&_[data-slot=name]]` selectors without prop drilling or `className` overrides per part.

## Theme system — OKLCH semantic tokens (no provider)

The library does **not** ship a `ThemeProvider` component or impose a runtime theme context. Theming is **pure CSS custom properties**, shadcn-convention, expressed in **OKLCH**.

- Atoms reference *semantic* token utilities only: `bg-background`, `text-foreground`, `bg-primary`, `bg-muted`, `bg-popover`, `bg-accent`, `border-input`, `border-border`, `ring-ring`, etc. — never raw colors, never `#000`/`#fff`.
- Those utilities resolve against CSS variables the **consumer** registers at the document root via Tailwind v4 `@theme inline`:

  ```css
  :root {
    --color-background: oklch(1 0 0);
    --color-foreground: oklch(0.15 0 0);
    --color-primary:    oklch(0.55 0.2 264);
    /* …full shadcn token set… */
  }
  [data-theme="dark"] {
    --color-background: oklch(0.15 0 0);
    --color-foreground: oklch(0.98 0 0);
    /* … */
  }
  ```

- **Dark mode** is driven by a `data-theme` attribute on `<html>`. `MosaicThemeToggle` flips that attribute (cycling its `themes` prop, default `["light","dark"]`) — so dark-mode token blocks must be keyed on `[data-theme="dark"]`.
- **Rebranding (Rule #2):** override any `--color-*` variable in your own stylesheet. No component swap, no fork.

> **Planned (T5):** the package will export `@vantageos/mosaic-blocks/styles.css` — a default OKLCH token set (`:root` + `[data-theme="dark"]`) — so consumers can `@import` it once for working defaults and override selectively. Until then, the consumer supplies the token block.

## Distribution

- **npm** — `@vantageos/mosaic-blocks`, ESM + CJS + DTS (tsup). Single entry `.` (plus the planned `./styles.css`).
- **shadcn registry** — `registry.json` (shadcn schema) exposes each component for copy-paste install via the shadcn CLI. See [USAGE.md](./USAGE.md).
- **versions.ts** — single-source pinned-dependency catalog (pattern from awslabs/nx-plugin-for-aws, Apache 2.0); `pnpm sync-versions` propagates to every `package.json`; a vitest drift guard fails CI on divergence.

## Quality gates

Seven hard-failing CI gates (no `continue-on-error`): lint (Biome) · typecheck · tests (Vitest) · parse-guard (TS compiler API) · build (tsup) · sandbox build (Next.js, Rule #19) · react-doctor@0.2.11 (Dimension 12). See [CONTRIBUTING.md](./CONTRIBUTING.md).
