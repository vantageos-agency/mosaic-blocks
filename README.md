# @vantageos/mosaic-blocks

**Alpha — not yet published.**

React "composed" blocks for VantageOS products. Distinct from `@vantageos/mosaic` (cross-runtime atoms): this library is React-only and targets full composed UI blocks.

## Stack

- Next.js 16 + React 19
- Tailwind v4 (OKLCH design tokens)
- @base-ui-components/react
- shadcn registry protocol

## Status

T1 bootstrap (build infra only). Real blocks land in T3/T4. Consumed by VP Cloud (Sigma) and vCRM Cloud (Theta).

## Gates

```
pnpm lint        # biome check
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm build       # tsup → dist/
pnpm sandbox:build  # next build inside sandbox/
```

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
