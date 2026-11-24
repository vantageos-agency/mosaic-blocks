# Changelog

All notable changes to `@vantageos/mosaic-blocks` are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed — the theme-tokens guard and `maskCommentsAndStrings` read tokens from the shared parse, never pair quotes (unreleased)

Three more hand-written quote scanners carried the defect the no-hardcoded-words guard just lost: a quote inside a comment or a regex literal is not a delimiter, yet it paired with the next quote below it and formed a fake string over real code. The parse-based token reader moves out of `scripts/no-hardcoded-words-guard.mjs` into **`scripts/source-tokens-shared.mjs`** (`readSourceTokens`, `blankRanges`, `loadTypeScript`, `SourceReadRefusal`; typed by `source-tokens-shared.d.mts`), and the guard imports it with its behaviour unchanged.

- **`scripts/theme-tokens-declared-guard.mjs`** — FORM 1 (`extractClassStringCandidates`) paired quotes over the whole file, comments included: an apostrophe in `// the column's width` swallowed the real string below it and an undeclared utility went unnamed. FORM 2 (`extractStringLiteralsSkippingComments`) skipped comments but not regex literals: a quote in `/'/` did the same. Both now read the string tokens of a parse of the file (by its extension, `.ts` / `.tsx`); the offsets they return and the static-text-with-U+0000 form of a template are unchanged. A file that does not parse, or a text-bearing token kind outside the census, refuses the run (exit 2, file named). JSX text is declared ignorable at the call site (this guard judges string literals only).
- **`scripts/docs-counts-shared.mjs` `maskCommentsAndStrings(src, keepStrings, fileName)`** (callers: `scanExportStatements`, `registry-json-derive.mjs` `specifiersIn` and its barrel cross-check) — it skipped comments but not regex literals, so an `import` or `export` line below `const re = /'/;` was masked as string content and its statement vanished; the output was also a different length from the input. It now blanks comments, regex literals and JSX text, keeps string and template delimiters, blanks string content unless `keepStrings`, and keeps the code inside a template's substitutions visible. Output length and line breaks equal the input's. Unparseable input throws `SourceReadRefusal` naming the file (`registry-json-derive` maps it to exit 2).
- Tests: `src/__tests__/source-tokens-shared.test.ts`, `docs-counts-mask-comments.test.ts`, `theme-tokens-declared-guard-forms.test.ts`, three cases in `registry-json-derive-dependencies.test.ts`; `scripts/tests/probe-theme-tokens-declared-guard.sh` gains section D1 (one mutation per hiding form on three real components chosen by a stated rule). `probe-no-hardcoded-words-guard.sh` and `probe-release-artifacts-guard.sh` install the shared module into their clones.
- Not moved, stated at its site: the cursor `skipLiteral` of the children walker in `no-hardcoded-words-guard.mjs` (it runs only on text the token reader already stripped of comments and regex literals, and fails closed). Scripts and tests only; no shipped code changes. The version is not bumped here.

### Fixed — the no-hardcoded-words guard reads string tokens from a parse, never pairs quotes across comments (unreleased)

**`scripts/no-hardcoded-words-guard.mjs`** (the SIN-01 guard on `dist/index.cjs`) paired quote characters across the raw text, so an apostrophe in a comment (`// the column's width`) paired with the next single quote below it and formed a fake string: a false positive, and a real word between two comment apostrophes was swallowed into that fake pair and never named (a false negative). It now reads text only from the tokens of a full `typescript` parse (already a devDependency): `StringLiteral`, `NoSubstitutionTemplateLiteral`, and the static segments of a template (`TemplateHead` / `TemplateMiddle` / `TemplateTail`). Comments and regex literals contribute no text and pair nothing. The guard refuses to judge (exit 2) on a parse error, on a text-bearing token kind it does not classify, or on any character that is neither a token nor a comment. Every existing form (PASS A, B, C, the exemptions, the BASELINE ratchet) is unchanged. `pnpm build` output: zero offenders before and after. Probe `scripts/tests/probe-no-hardcoded-words-guard.sh` gains: one mutation per comment form (`//`, `/* */`, JSDoc), each with an apostrophe beside a new single-quoted CSS-selector string, injected into real component files derived by rule (the first three with a string argument inside a multi-line `cn(` call), landing asserted in the built bundle, guard required to add no offender; one mutation per token kind on real bundle lines (string, template, template with substitution, words hidden between comment apostrophes, regex quotes); a census check against `ts.SyntaxKind`; refusals for an unparseable bundle and for a `JsxText` token. Its injected subjects are `zq` nonces proven absent by the shared `subject_sites` predicate. The version is not bumped here.

### Fixed — `pnpm gate:local` is a usable self-gate: the words-guard probe controls its subjects, the real-browser step names what it lacks (unreleased)

**`scripts/tests/probe-no-hardcoded-words-guard.sh`** (gate step "Probe — no hardcoded words guard bites") — the 22 PASS C member forms injected typed words; `"print"` already existed in `src/components/registre/GrilleRegistre.tsx`, so the probe declared itself invalid and the step was red on every run. Each slot's word is now derived at run time: the preferred word is kept only when one shared predicate (`subject_sites`) proves it absent as a string literal from the clone's `src` and from the clean baseline bundle, and not taken by another slot; otherwise the first reserve word that passes. A slot no candidate passes refuses the probe, naming the slot and each rejected candidate with its site. An independent check re-proves every injected word absent and names the collision if the derivation is bypassed. The PASS C `zq*` nonces, whose expected offender count also assumed their absence, go through the same predicate.

**`scripts/gate-local.mjs`** — a step that runs `playwright test` (directly or through a package script) is checked before it runs: Playwright's own `--dry-run` of the job's install line names the browser directories; a missing one, or a system library a present browser cannot load (`ldd`, Linux), reports the step `COULD-NOT-RUN` with the missing items and how to provision them (`pnpm gate:local --install-browsers`, no root; `sudo … install-deps` for libraries). Such a step is never executed into a generic red and never counted as passed; a run with no failure but a could-not-run step exits 2. Scripts only; no shipped code changes.

### Fixed — registry-json-derive tells a refusal from a violation by exit code (unreleased)

**`scripts/registry-json-derive.mjs`** — three exit states. `0` clean; `1` a violation found in artifacts it fully read (an item missing or stale, saved dependencies that drifted from the imports, an import of a package `package.json` does not declare — the `DerivationViolation` class, the only one mapped to 1); `2` with `REFUSING TO JUDGE: <what>` when it could not read something it needs (an unreadable, absent or malformed file, an export form or a non-literal `import()`/`require()` it cannot read, a declared exception it cannot apply, `--check` with `--stdout`). Any other error also maps to 2 (fail-closed). `non-shipped.mjs` is now imported inside the handler, so a missing `tsconfig.test.json` or `.storybook/main.ts` also refuses with 2 instead of ending the process with 1. Script and test only; no shipped code changes.

### Fixed — MosaicSelect and MosaicToolToggleList tests wait for an interactive popup (unreleased)

`MosaicSelect.test.tsx` ("closes popup on Escape key", "selects an item and calls onValueChange") and `MosaicToolToggleList.test.tsx` (option click) sent Escape or an option click as soon as the option text was in the DOM. base-ui opens the Select inside `requestAnimationFrame`; at that instant the document-level Escape listener (a passive effect) is not attached yet and the positioner still carries `pointer-events: none`, so the interaction was dropped and the test failed under load. The tests now wait until focus is inside the popup, which base-ui sets in a later frame. Test-only change.

### Added — GrilleRegistre pagination and localeText (unreleased)

**GrilleRegistre** (`src/components/registre/`) gains four optional props forwarded to AG Grid: `pagination?: boolean`, `paginationPageSize?: number`, `paginationPageSizeSelector?: number[] | boolean` and `localeText?: Record<string, string>` (grid UI text keyed by AG Grid locale key; the host owns the language). Omitted, each stays at AG Grid's own default, so existing hosts are unchanged: the `GrilleRegistreProps` declaration in `dist/index.d.ts` gains these four members and nothing else. The version is not bumped here: the release-artifacts guard forbids it, the bot derives it after merge.

### Fixed — registry items carry the dependencies their files import (unreleased)

**`scripts/registry-json-derive.mjs`** — an item's `dependencies` is now always the derivation from the real import statements of its files (comments and string literals masked), for every item; the saved list of an existing item is no longer preserved. Before this fix, 52 of 140 items in `registry.json` on `origin/main` @ e735ce0 carried a list that differed from their imports (measured by the new test in `src/__tests__/registry-json-derive-dependencies.test.ts`, which compares every item's saved list with `dependenciesOfFiles` over its files): 44 omitted `class-variance-authority`, `mosaic-document-table` omitted `ag-grid-community`, and 7 listed `@clerk/nextjs`, `@vantageos/cloud-identity` or `next-themes`, packages named only in their comments. A host installing those items from the registry got the wrong packages. `title`, `description` and `type` stay curated. `pnpm registry:derive --check` now also names every item whose saved `dependencies` differs from the derivation (probe `scripts/tests/probe-registry-json-derive.sh` mutates one real item per drift form: a missing package and an extra one). `registry.json` and the 52 affected `r/*.json` files are regenerated by `pnpm registry:derive` and `pnpm build:registry-items`; only their `dependencies` fields change, so `pnpm check:registry-items-drift` stays at 0. The version is not bumped here.

### Fixed — MosaicToolToggleList test no longer races the Select open (unreleased)

`MosaicToolToggleList.test.tsx` queried the approval option with a synchronous `getByRole` right after clicking the trigger, but base-ui Select opens on `mousedown` inside `requestAnimationFrame`, so under load the query ran before the popup mounted. Both option queries now `await screen.findByRole("option", …)`. Test-only change.

### Changed — MosaicDocumentTable renders through GrilleRegistre (unreleased)

**MosaicDocumentTable** (`src/components/document-review/`) — rebuilt as a composition of `GrilleRegistre` (AG Grid) instead of `MosaicDataTable`, so a document-review screen and a registry screen render through one table component. The public API is unchanged: `MosaicDocumentTableProps<T>`, `MosaicDocumentTableRowContext` and the function signature are identical in `dist/index.d.ts`. Behaviour kept: the column model and its visibility, the first column's real `<button>` (each row's keyboard stop — grid cells take no focus of their own), controlled or internal selection, `renderPanel` with `orderedRowIds`, the host's row order (no sort, no filter), `emptyMessage` (now the grid's no-rows overlay). One timing difference: a click is resolved through AG Grid's `cellClicked`, which AG Grid dispatches asynchronously, so `onSelectedRowChange` fires on the next task rather than inside the click handler. `MosaicDataTable` itself is unchanged. **GrilleRegistre** gains an optional `messageVide?: string` — the text of the grid's no-rows overlay (AG Grid's provided overlay, `overlayComponentParams.noRows.overlayText`); omitted, AG Grid's default stays. The version is not bumped here: the release-artifacts guard forbids it, the bot derives it after merge.

### Added — registry-screen blocks (unreleased)

**GrilleRegistre / RegistreEcran / PanneauRegistreShell / RegistreLigneDetail + `ChoixColonnes`** (`src/components/registre/`) — moved from the first host application so every registry screen mounts one grid, one chrome and one row panel. `GrilleRegistre<T>`: AG Grid Community from the caller's `columnDefs`, `getRowId`, global quick filter, every column sortable/filterable (floating filter)/resizable; optional `theme` (default `registreGridTheme`, HeroUI variables). `RegistreEcran`: fullscreen section (Escape leaves, body scroll locked, an open overlay takes Escape first), controlled global search and column chooser, toolbar slots. `PanneauRegistreShell`: HeroUI Drawer, left-edge resize, ArrowUp/ArrowDown row navigation (ignored inside an editable field — reuses `isEditableTarget`), prev/next footer, `forceWidthRatio`. `RegistreLigneDetail`: per-field detail driven by `ColonneRegistre` (pencil on editable fields, computed label otherwise, correction line), one write path `onSaveField(champ, saisie)`. Every word is a required `labels` prop; amounts, numbers and the edit decimal separator are required host formatters. New peer dependencies: `@heroui/react ^3.2.5`, `ag-grid-community ^36.1.0`, `ag-grid-react ^36.1.0`, `lucide-react ^0.511.0`. Test setup polyfills `CSS.escape` (react-aria reads it on mount). The version is not bumped here: the release-artifacts guard forbids it, the bot derives it after merge.

### Added — document review (unreleased)

**MosaicDocumentTable / MosaicDocumentCriteriaPanel + `src/lib/document-review/`** — generic, vocabulary-free parts for a document-review screen. `MosaicDocumentTable<T>` composes `MosaicDataTable`: rows and a column model from props, column visibility from the model (`defaultVisible`, or a `columnVisibility` override), row selection (click, or the first cell's real button) opens `renderPanel`. `MosaicDocumentCriteriaPanel<T>` composes `MosaicTabs` + `MosaicResizableSplitPane` + `MosaicPdfViewer` + `MosaicEditableCell`: it opens on **Compare** (document left, fields right) with no interaction; each field is editable and shows a host-supplied provenance label; an edit reports `{ rowId, field, input, by, provenance }` to `onCorrect`; prev/next walk the host's row order. Every word is a prop (`labels`, column labels): required, no default. Stack-free logic: `ReviewPanelTab` / `INITIAL_REVIEW_PANEL_TAB`, `neighbourRowId`, `applyFieldCorrection` (validate, write, keep the first original + corrected + who/when/provenance, failed write returns the row from before, an unechoed write is `confirmed: false`), `ReviewColumn` model with `visibleColumns` / `toggleColumnVisibility`. Declared: `./lib/document-review/index.js` joins `NON_REGISTRY_SOURCES` in `scripts/registry-json-derive.mjs` (same status as `./hooks/useMediaQuery.js`). The version is not bumped here: the release-artifacts guard forbids it, the bot derives it after merge.

### Changed

**BREAKING (per component) — nine hardcoded English unit words removed; each is now a REQUIRED host-supplied formatter prop (no default, no fallback).** The library ships zero user-facing words of its own for these sites.

- **MosaicAgentComposer / MosaicAgentComposerDesktop / MosaicAgentComposerMobile** — new required `formatContextWindow: (tokens: number) => string` on the shared `MosaicAgentComposerProps` (replaces `"{n} context"`). Hosts own number formatting, unit word and word order.
- **MosaicAdaptiveNavigation** — new required `formatDuration: (seconds: number) => string` (replaces `"{n}s"` in both the mobile accordion and the desktop tab strip).
- **MosaicTemplateGallery / MosaicTemplateCard** — new required `formatAgentCount: (count: number) => string` (replaces `"{n} agents"`) and `formatUsageCount: (count: number) => string` (replaces `"{n} uses"`); the gallery forwards both to every card.
- **MosaicActivityFeed / MosaicActivityItem** — new required `formatMessageCount: (count: number) => string` (replaces `"{n} messages"`); the feed forwards it to every row.
- **MosaicMultiOrgIndicator** (`org-panel`) — new required `formatOrgCount: (count: number) => string` (replaces `"{n} orgs"`, both the button and the badge variants).

**no-hardcoded-words guard (PASS C) — a word in a `children` expression is judged wherever the walk reaches it.** Every string or template literal inside a rendered JSX `children` value is rendered by default: spread elements (`[...["a"]]`), call arguments (`Array.of("a")`, `String("a")`, `.concat(["a"])`), nested arrays, conditionals and template interpolations are walked. A call whose callee the walk cannot classify (`fmt("a")`, a computed callee, `createElement`, a callback-taking member) exits 2 naming the call; only calls proven not to return their arguments, element constructors (`jsx`/`jsxs`) and statements of a function body outside `return` are exempted, each stated in the guard header. The probe pins its own pnpm from `package.json` and names the failing setup step.

**no-hardcoded-words guard — the rendered-child position is judged before the `KeyboardEvent.key` exemption.** A key-set word (`Delete`, `Home`, `End`, `Enter`, `Tab`, ...) rendered as a JSX child (`{display}Delete`) used to pass unjudged because the key-set exemption ran first. PASS C now decides first; the exemption keeps only the non-rendered positions (`.key ===` operand, array / `Set([...])` member, `case` label of a `switch` on `.key`), stated in the guard header. Tooling only, no version bump.

### Added — 0.5.18-alpha

**MosaicTagInput** (`src/components/tag-input/`) — presentational tag/chip input with optional autocomplete. Fully controlled: `tags: string[]`, `onAddTag`, `onRemoveTag`, required `placeholder` + `removeTagAriaLabel` (per-tag, no default). `Enter` commits the trimmed typed value (rejecting empty/duplicate); `Backspace` on an empty field removes the last tag. `maxTags?` refuses loudly — the input exposes `aria-disabled="true"` + `data-max-reached="true"`, never a silent no-op. `suggestions?` filtered with `@base-ui/react/combobox`'s `useFilter({ sensitivity: "base" }).contains`, excluding already-selected tags. 10 TDD tests.

### Added — 0.5.17-alpha

**MosaicResizableSplitPane** (`src/components/resizable-split-pane/`) — presentational resizable two-pane content layout. Forms a pair with `MosaicPdfViewer`: replaces the modal document-preview pattern (see document OR edit fields, never both) with a draggable side-by-side split. Props: `main`, `side` (both `React.ReactNode`), `sideWidth?`/`onSideWidthChange?` (host-controlled percentage), `isSideCollapsed?`/`onToggleSideCollapsed?`, required `collapseButtonAriaLabel` + `resizeHandleAriaLabel` (no default). Resize via pointer drag on the handle or `ArrowLeft`/`ArrowRight` on the keyboard-focusable `role="separator"` handle (`aria-orientation="vertical"`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`). No split-pane library dependency. 17 TDD tests, including a mutation-proven `pointermove`/`pointerup` listener-cleanup-on-unmount test.

### Changed — Tech Debt (DETTE A + B)

**DETTE A — react-doctor allow-list for 3 cva/compound false-positives (config only)**
Added `react-doctor.config.json` with an `ignore.overrides` entry that scopes the `react-doctor/only-export-components` rule to three files that legitimately export non-component utilities alongside components:
- `src/components/button/Button.tsx` — `buttonVariants` (cva helper, public API)
- `src/components/badge/MosaicBadge.tsx` — `badgeVariants` (cva helper, public API)
- `src/components/field/MosaicField.tsx` — `MosaicField` compound via `Object.assign`

These are deliberate library patterns, not fast-refresh violations. The config uses the per-file, per-rule `ignore.overrides` mechanism (see react-doctor config schema). Zero component source files were edited; zero other rules or files were suppressed. Full-scan `only-export-components` errors: 3 → 0.

**DETTE B — MosaicField ref-forwarding test**
Added one unit test to `src/components/field/MosaicField.test.tsx` proving the React-19 ref-as-prop pattern forwards a ref through `MosaicField` (root) to the underlying `<div>` DOM element. Mirrors the ref-forwarding test style from `Button.test.tsx` and `MosaicInput.test.tsx`. Test count: 167 → 168.

### Added — T4 (rescoped Option A)

Two net-new deliverables landing in this wave. Four additional patterns (MosaicNavbar, MosaicStatsGrid, MosaicLogosGrid-static, MosaicPricingCard) were already shipped in Batch A and are subsumed here by reference.

**MosaicFeature3Col** (`src/components/feature-3col/`) — new 3-column feature grid section, distinct from the existing `MosaicFeatureCenteredMedia` (which is a single centered layout with media slot). Props: `heading?`, `subtext?`, `features: Feature3ColItem[]` (each item: `id`, `title`, `body`, `icon?`). Responsive: 1 column on mobile, 3 columns at `md+`. Optional icon slot per cell. `data-slot="feature-3col"` on root `<section>`, `data-slot="feature-3col-item"` on each cell. React-19 ref-as-prop. OKLCH semantic tokens only. 8 TDD tests.

**MosaicLogosGrid stagger-motion variant** — opt-in `stagger?: boolean | number` prop added to the existing `MosaicLogosGrid` (DRY, no new component). When truthy, logos animate in with a CSS keyframe staggered reveal (`mosaic-logo-in`), applying per-item `animation-delay` increasing by `stagger` ms (or 80ms default when `true`). Fully backward-compatible: existing behavior is preserved when `stagger` is omitted. Respects `prefers-reduced-motion: reduce` — no animation or delay applied when set. Same keyframe injection pattern as `MosaicAnimatedList`. 4 new TDD tests.

### Changed

- **MosaicLogosGrid stagger keyframe** (`mosaic-logo-in`) now ships statically in `styles.css` instead of runtime injection (cleaner SSR, no runtime `<style>` insertion). Stagger requires importing `@vantageos/mosaic-blocks/styles.css` (already required for theming).
- **MosaicFeature3Col** icon-slot now uses `size-10` Tailwind shorthand instead of separate `h-10 w-10`. Behavior identical.
- Added MIT LICENSE file (backs package.json license:MIT); corrected package description (no longer "not yet published"). Ships in next publish — 0.1.0-alpha.1 already live, no republish.

## [0.1.0-alpha.1] — 2026-06-15

### Added

- Shippable `@vantageos/mosaic-blocks/styles.css` default OKLCH token set: 19 semantic tokens (`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`), light `:root` block + dark `[data-theme="dark"]` block, `@theme inline` Tailwind v4 mapping for all 19 tokens, branding-swappable via var override per Rule #2.
- npm publish wiring: `"private": true` removed, `"license": "MIT"`, `"publishConfig": { "access": "public" }`, `repository` + `homepage` fields, `"./styles.css": "./dist/styles.css"` export entry.
- `scripts/copy-assets.mjs`: copies `src/styles.css` → `dist/styles.css` as part of the `build` script.
- Sandbox (`sandbox/src/app/globals.css`) now imports `@vantageos/mosaic-blocks/styles.css` — export exercised by `sandbox:build`.

### Added — T3-C Batch C: 10 base-ui atoms (2026-06-15)

Ten interactive/static atoms ported onto `@base-ui/react@1.5.0` primitives, completing the
11-atom Batch C set (MosaicButton shipped in T0-ARCH). All props-driven, OKLCH theme-reactive,
branding-swappable, `data-slot` API. RED-first TDD: 82 new tests across 10 files, 100% passing.

| Atom | Primitive | Notes |
|------|-----------|-------|
| `MosaicCard` (+Header/Title/Description/Content/Footer) | style-only | composable surface |
| `MosaicBadge` | style-only | cva: default/secondary/destructive/outline |
| `MosaicAvatar` | `@base-ui/react/avatar` | image + fallback |
| `MosaicInput` | `@base-ui/react/input` | ref → native input |
| `MosaicInputGroup` | composition | prefix/suffix addons |
| `MosaicField` (+Label/Control/Description/Error) | `@base-ui/react/field` | wired a11y associations |
| `MosaicSwitch` | `@base-ui/react/switch` | controlled + uncontrolled, role=switch |
| `MosaicSelect` | `@base-ui/react/select` | items[] API, keyboard nav |
| `MosaicCombobox` | `@base-ui/react/combobox` | useFilter "contains", native in 1.5.0 |
| `MosaicDropdownMenu` | `@base-ui/react/menu` | trigger + items[], keyboard nav |

**base-ui 1.5.0 API notes:** `onValueChange` receives `(value, eventDetails)` (value can be `null`);
`Field.Error` renders `<div>` with `match` prop; `Select.Value` needs a render child for label mapping;
`Menu.Trigger` uses `render` prop (not `asChild`); `Switch.Root` dispatches PointerEvent (tests use keyboard).

**Gates (all green):** test 98/98 (13 files) · typecheck 0 · biome 0 · tsup ESM+CJS+DTS · sandbox:build static (Rule #19).

### Added — T3-A Batch A: 8 landing-section blocks (2026-06-15)

Eight production-ready landing page section blocks ported from heyfabrika/styleui (MIT).
All blocks are fully props-driven — zero hardcoded branding, colors, copy, or logos.
OKLCH CSS tokens throughout (no pure `#000`/`#fff`).
RED-first TDD: 35 new tests (8 new test files), 100% passing.

| Block | Props API (key props) |
|-------|-----------------------|
| `MosaicNavbar` | `logo`, `links[]`, `cta?` — scroll-aware hide-on-scroll-down, mobile menu |
| `MosaicHeroSplit` | `title`, `subtitle`, `eyebrow?`, `cta?`, `ctaSecondary?`, `media?` |
| `MosaicFeatureCenteredMedia` | `title`, `body`, `features[]?`, `media?` |
| `MosaicStatsGrid` | `stats[] {label, value}`, `heading?`, `subtext?` |
| `MosaicPricingCard` | `tier`, `price`, `features[]`, `cta`, `highlighted?` |
| `MosaicLogosGrid` | `logos[] {name, src, width?, height?}`, `heading?` |
| `MosaicTestimonialsGrid` | `testimonials[] {id, quote, author, role, avatar?, logo?}`, `heading?` |
| `MosaicFooterSimple` | `columns[] {id, heading, links[]}`, `legal`, `logo?`, `social[]?` |

**New dependencies:** none — motion/react intentionally excluded (CSS transitions used
instead for bundle budget). Native `<img>` used (lib-portable; wrap with `next/image`
at consumer level).

**Gates (all green):**
- `pnpm test`: 38/38 (10 files)
- `pnpm typecheck`: 0 errors
- `pnpm lint` (biome): 0 errors
- `pnpm build` (tsup ESM+CJS+DTS): success
- `pnpm sandbox:build` (Next.js 16): static / 0 errors

### Added — Documentation (2026-06-15)

- `docs/ARCHITECTURE.md` — library layers, @base-ui/react foundation, OKLCH theme system (consumer-provided semantic tokens, `data-theme` dark mode, planned `styles.css` export), distribution model.
- `docs/USAGE.md` — npm + shadcn-registry consumption, required theme setup, full component catalog.
- `docs/CONTRIBUTING.md` — TDD RED-first workflow, local + CI gates, naming/theming conventions, docs-sync obligation.
- `README.md` — added Documentation index (relative links), Install section, and a component Catalog table with per-batch ship status.

### Added — T3-B Batch B: 6 utility blocks + useMediaQuery (2026-06-15)

6 utility blocks + 1 hook ported from heyfabrika/styleui (MIT). All theme-reactive via OKLCH CSS vars. Zero hardcoded branding. Zero new runtime dependencies.

- `MosaicCounter` — animated metric count-up via requestAnimationFrame (easeOutExpo). Props: `value`, `duration?`, `format?`. Respects `prefers-reduced-motion`.
- `MosaicThemeToggle` — light/dark/system theme toggle. Flips `data-theme` on `document.documentElement`. Props: `themes?`, `onChange?`, `label?`.
- `MosaicBlurredOrb` — decorative blurred gradient orb. Pure CSS (`filter: blur`). Props: `colors?`, `size?`, `position?`, `blur?`, `opacity?`. `aria-hidden`.
- `MosaicAnimatedList` — staggered reveal list via CSS keyframe + inline `animation-delay`. Props: `stagger?`, `children`, `as?`. Respects `prefers-reduced-motion`.
- `MosaicIntegrationsBadge` — integration pill badge. Renders as `<a>` when `href` provided. Props: `label`, `logo?`, `href?`, `target?`.
- `MosaicFallingPattern` — animated dot-grid background (SVG pattern + CSS falling dot animation). Props: `density?`, `color?`, `animationDuration?`. `aria-hidden`.
- `useMediaQuery(query): boolean` — SSR-safe media query hook; subscribes via `addEventListener("change")` in effect only.

**Bundle decision:** `motion` (framer-motion) evaluated and rejected — all animations achievable with native rAF + CSS keyframes. 0 new runtime deps. Registry: 6 blocks added. Tests: RED-first, 25 new.

### Added — T1.5 CI Workflow (2026-06-15)

Hard-failing GitHub Actions CI workflow (`.github/workflows/ci.yml`) — all 7 gates, no `continue-on-error`. Runs on every PR and push to `main`.

**Gates:**
1. Lint — Biome, 0 warnings.
2. Typecheck — `tsc --noEmit`, 0 errors.
3. Tests — Vitest, all green.
4. Parse guard — `scripts/parse-guard.mjs` via TypeScript compiler API `parseDiagnostics`. Exits non-zero on any syntax/parse error. Mirrors vantage-immo #89 bundleGuard pattern (fix-pattern m978csm3).
5. Build — tsup ESM+CJS+DTS.
6. Sandbox build — `next build` inside `sandbox/` (Rule #19).
7. React-doctor — `react-doctor@0.2.11` (pinned, NEVER @latest) with `--diff origin/main --fail-on error --annotations`. Dimension 12 in CI.

**Scripts added:** `pnpm parse-guard` (`node scripts/parse-guard.mjs`).

**Action pins:** `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`. pnpm store cached via `setup-node` built-in cache.

### Added — T0-ARCH: @base-ui/react adoption + MosaicButton spike

- **ADR-0001** (`docs/adr/0001-base-ui-vs-radix.md`): Architecture Decision Record adopting `@base-ui/react` as the headless primitive layer for Batch C interactive atoms. Documents rationale, per-primitive availability across all 11 Batch C atoms, risks, and consequences.
- **MosaicButton** (`src/components/button/Button.tsx`): First production interactive atom. Built on `@base-ui/react/button`. Six variants (default, secondary, ghost, destructive, outline, link), six sizes (default, sm, lg, icon, icon-sm, icon-lg). `data-slot="button"`, forwardRef, accessible by default.
- **MosaicButton test suite** (`src/components/button/Button.test.tsx`): 10 RED-first TDD tests. Covers render, variant classes, click handler, ref forwarding, disabled state, `data-slot` attribute.
- **registry.json**: Added `mosaic-button` entry in shadcn registry format.
- **sandbox/src/app/page.tsx**: Renders MosaicButton variants/sizes/states so `sandbox:build` exercises the component (Rule #19).
- **class-variance-authority** (`^0.7.1`): Added as production dependency for variant management.
- **@testing-library/user-event**: Added as dev dependency for click interaction tests.
- `src/versions.ts`: Added `class-variance-authority` version entry.

### Changed

- `README.md`: Added MosaicButton usage, @base-ui/react rationale, ADR-0001 link, CI badge + gates table, Batch A blocks section.

---

## [0.1.0-alpha.0] — 2026-06-10

### Added

- T1 bootstrap: build infra (tsup ESM+CJS+DTS), vitest test harness, Next.js 16 sandbox, biome linter, versions.ts catalog, sync-versions script, versions drift guard.
- `src/versions.ts` — pinned-dependency catalog (pattern from awslabs/nx-plugin-for-aws, Apache 2.0).
- `scripts/sync-versions.mjs` — propagates catalog to all package.json files.
- `src/versions.test.ts` — drift guard (CI catches package.json drift).
- `Placeholder` component (scaffold — removed when T3 lands real blocks).

---

Orchestrator: Gamma — VantageOS Team | 2026-06-15
