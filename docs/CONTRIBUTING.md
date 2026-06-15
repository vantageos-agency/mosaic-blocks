# Contributing — @vantageos/mosaic-blocks

## Prerequisites

- Node ≥ 20, `pnpm` (version pinned via `packageManager` in `package.json`).
- `pnpm install` at the repo root installs the library workspace. The `sandbox/` app is a **standalone** Next.js project (not a workspace member) — it links the built `dist/` via a `file:..` dependency, so run `pnpm build` before `pnpm sandbox:build`.

## Workflow

1. **Branch** off `main` (`gamma/<feature>` for the VantageOS team).
2. **TDD, RED-first.** Write the failing `*.test.tsx` before the implementation, then make it green. Interactive atoms (Select/Combobox/DropdownMenu/Switch) **must** include `@testing-library/user-event` interaction tests: open/close, keyboard (Enter/Space/Arrow/Escape), and ARIA state.
3. **Mirror the canonical pattern** in `src/components/button/Button.tsx`: `cva` for variants, `data-slot`, the shared class-merge util — do not introduce a parallel convention.
4. **Docs-sync (mandatory).** Every PR updates `README.md` (if API touched), the `CHANGELOG.md` `[Unreleased]` section, and any `docs/` page whose contract changed. The `completionNote` cites touched doc paths.
5. **Open a PR** → review → merge in dependency order.

## Local gates (must all pass)

```bash
pnpm lint           # Biome — 0 warnings
pnpm typecheck      # tsc --noEmit (lib + tests) — 0 errors
pnpm test           # Vitest — all green
pnpm parse-guard    # TS compiler API syntax guard (scripts/parse-guard.mjs)
pnpm build          # tsup → dist/ (ESM + CJS + DTS)
pnpm sandbox:build  # next build inside sandbox/ (Rule #19 — every component rendered)
```

CI (`.github/workflows/ci.yml`) runs these same seven gates hard-failing on every PR and push to `main`, plus `react-doctor@0.2.11` (pinned, never `@latest`) as the Dimension-12 check.

## Conventions

- **Naming:** `Mosaic`-prefixed exports (`MosaicButton`, `MosaicSelect`…). Sub-parts either as named exports (`MosaicCardHeader`) or `Object.assign` namespaces (`MosaicField.Label`).
- **Theming:** semantic OKLCH token utilities only — never raw colors or `#000`/`#fff`. See [ARCHITECTURE.md](./ARCHITECTURE.md#theme-system--oklch-semantic-tokens-no-provider).
- **Branding-swappable (Rule #2):** all copy/colors/logos via props or CSS variables; zero hardcoded brand.
- **Dependencies:** add via `src/versions.ts` + `pnpm sync-versions` (never edit a `package.json` version by hand — the drift guard fails CI).
- **Comments:** explain *why* for non-obvious decisions only; never narrate *what* the code does.
