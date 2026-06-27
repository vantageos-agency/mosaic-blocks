# fix(build): preserve "use client" directive in dist — App Router SSR fix (closes #25)

**Version**: 0.2.1-alpha
**Branch**: gamma/fix-use-client-dist
**Date**: 2026-06-27

## Problem

`tsup` bundled all 42 `"use client"` source modules into a single `dist/index.js` +
`dist/index.cjs` and **stripped** every directive. Next.js App Router consumers crashed
at module-eval during SSR/prerender because the published dist had no `"use client"` marker.
Kappa's VP-dashboard refonte required an ad-hoc shim to work around this.

## Approach chosen: banner (not preserve-directives)

**Why not `esbuild-plugin-preserve-directives`?**

With `splitting: false` and a single entry point (`src/index.ts`), the plugin has no
per-module file to annotate — every export collapses into one bundle. The plugin is
designed for code-splitting scenarios where each output chunk maps to an input module.
Forcing per-module output here would require switching to multi-entry or enabling
`splitting: true`, which is a larger architectural change with unknown downstream impact
on consumers.

**Why banner is correct here:**

- 42/42 source files carry `"use client"` — there are zero server components in this package.
- The entire library is interactive (hooks, context providers, event handlers, state).
- `banner: { js: '"use client";' }` adds the directive as the first line of both
  `dist/index.js` (ESM) and `dist/index.cjs` (CJS) — exactly what Next.js App Router
  requires.
- Trade-off: the whole bundle is treated as a client module, so consumers cannot
  tree-shake a mosaic-blocks export and use it as a server component. This is acceptable
  because no mosaic-blocks component is or should be a server component.

## Changes

- `tsup.config.ts`: added `banner: { js: '"use client";' }` with explanatory comment
- `package.json`: bumped `version` from `0.2.0-alpha` to `0.2.1-alpha`

## Verification

```
head -1 dist/index.js   → "use client";
head -1 dist/index.cjs  → "use client";
```

Orchestrator: Gamma — VantageOS Team | 2026-06-27
