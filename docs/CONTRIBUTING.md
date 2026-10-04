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

`.github/workflows/ci.yml` still defines these gates (plus `react-doctor@0.2.11`, pinned, never `@latest`), but **GitHub Actions is off on this repository** (a deliberate, fleet-wide cost decision). Nothing in `ci.yml` runs on its own: use `pnpm gate:local` (below) to run it.

## Delivering a PR with Actions off

Actions is off, so no check runs on a push and no PR can show "CI green". The formal gate is the **author's full local run** plus the **reviewer's rerun on a fresh clone**.

**Author, before requesting review:**

1. Run `pnpm gate:local`. It reads `.github/workflows/ci.yml` and runs its `run:` steps in order, per job — the list is derived from the YAML, never retyped, so a step added to `ci.yml` appears with no edit to the runner. Steps that cannot run locally (actions such as `actions/checkout`, secrets, `${{ github.* }}` contexts, publish steps, `playwright install --with-deps`, steps whose CI context the event emulation below cannot supply) are **skipped with a printed reason**, never silently; the rules live in one place, `SKIP_RULES` in `scripts/gate-local.mjs`. Exit code is non-zero if any step that ran failed (1), or if the workflow contains a construct the runner cannot interpret (2, naming it).
2. Paste the summary line in the PR body, e.g. `gate:local — N run / M total, K skipped, F failed`, with the skipped list and any named failure.
3. Run `pnpm registry:derive`. Commit `registry.json` if it changed. `registry.json` is derived from `src/index.ts` **by the author, in the PR** — no CI job or bot derives it after the merge while Actions is off. Cite a proof that the committed file equals the derivation:

   ```bash
   cmp registry.json <(node scripts/registry-json-derive.mjs --stdout) && echo EQUAL
   pnpm registry:derive --check   # exit 0 = registry.json covers every exported component directory
   ```

   `--stdout` prints the derivation and writes nothing. The release-artifacts guard applies the same test: a PR may touch `registry.json` only when it is byte-identical to that derivation (a hand edit differs and is refused). Item `description` text is curated content the deriver preserves, so editing a description alone stays equal and passes.

**Reviewer, on a fresh clone of the PR head:** rerun `pnpm install --frozen-lockfile`, `pnpm gate:local`, and the `cmp` line above (`EQUAL` means the committed file equals the derivation). The author's pasted output is a claim; the reviewer's rerun is the gate.

**"CI green" is never claimed while Actions is off.** Say "`gate:local` N run / M total, F failed" and name what was skipped. The PR-conditioned guards in `ci.yml` (release-artifacts, skills-standard, PR-title, merge-commit title) DO run under `gate:local`: it emulates the CI event with base = `origin/main` (override: `--base <ref>`), head = `HEAD` and title = `git log -1 --format=%s`, from the single `EVENT_EMULATION` table in `scripts/gate-local.mjs`. The derive job's writing steps are skipped; its `--check` steps (`pnpm registry:derive --check`, `pnpm docs:counts --check`, the derived-docs suite) run. The Playwright browser install needs `--install-browsers` (opt-in, no `--with-deps`).

## Conventions

- **Naming:** `Mosaic`-prefixed exports (`MosaicButton`, `MosaicSelect`…). Sub-parts either as named exports (`MosaicCardHeader`) or `Object.assign` namespaces (`MosaicField.Label`).
- **Theming:** semantic OKLCH token utilities only — never raw colors or `#000`/`#fff`. See [ARCHITECTURE.md](./ARCHITECTURE.md#theme-system--oklch-semantic-tokens-no-provider).
- **Branding-swappable (Rule #2):** all copy/colors/logos via props or CSS variables; zero hardcoded brand.
- **Dependencies:** add via `src/versions.ts` + `pnpm sync-versions` (never edit a `package.json` version by hand — the drift guard fails `pnpm test`).
- **Comments:** explain *why* for non-obvious decisions only; never narrate *what* the code does.
