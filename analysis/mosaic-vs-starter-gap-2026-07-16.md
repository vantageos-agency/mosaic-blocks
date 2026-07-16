# mosaic-blocks vs reference-app UI gap audit

**Scope**: read-only visual/structural audit. Zero code changed by this document.
**Direction (decision, already made)**: align mosaic-blocks tokens/components on the reference app's look. The reference app is NOT rewritten.

## Provenance (state, resolved at audit time — re-derive before acting on this later)

- Reference app SHA actually audited: **`5fcc2459eda4384882245790c885c071098b0420`** (`origin/main`), read from a clean detached worktree (`git worktree add <tmp> origin/main`), NOT the dirty/stale local checkout (which sat on branch `audit/react-doctor-2026-05-29` at `a352aa4`, with uncommitted local edits). This SHA is a snapshot; the branch will move.
- mosaic-blocks SHA this document was written against: `f5a2e62467feb9a68117fae3ad49f3cd8b6d3e98` (branch `gamma/starter-gap-audit`, cut from `main` at `e3c4e61`).
- Component inventory derived, not typed from memory: `grep -o "^export { Mosaic[A-Za-z0-9]*" src/index.ts | sort -u` → 96 exports at time of audit (re-run before any PR to re-derive; do not copy this count forward).
- **No screenshots were produced.** This is a static read of source files (CSS, TSX) across both repos — no dev server was booted, no browser render was captured. Any "visual" claim below is inferred from token values and class names, not from a pixel comparison. Flagged explicitly per instruction rather than asserting a visual proof that doesn't exist.

## 1. Design language of the reference app (read from source, not assumed)

### 1.1 Token architecture
- Tailwind v4, CSS-first `@theme` block in `app/globals.css`, colors in OKLCH, **zero chroma neutrals** (pure grayscale, no brand hue tint on neutrals in the default preset).
- **Swappable style-preset system**: `styles/presets/base.css` defines the CSS-variable palette; six named "style" overlay files (`style-vega.css`, `style-nova.css`, `style-lyra.css`, `style-maia.css`, `style-mira.css`, `style-luma.css`) are imported unconditionally and gated by a `body` class (`.style-luma`, etc.), each overriding component-level utility classes (`.cn-button`, `.cn-switch`, `.cn-checkbox`, `.cn-slider`, `.cn-radio-group`...). This is a **runtime-swappable design-system layer**, not a single fixed token set.
- Radius: derived, not fixed — `--radius-sm/md/lg/xl/2xl/3xl/4xl` are all `calc(var(--radius) * factor)`, so one base `--radius` (0.625rem in the `base` preset) cascades to every size. The Luma preset's button treatment is `rounded-4xl` (full pill), i.e. the preset overrides the *shape family*, not just the base unit.
- Shadows: 5-step scale (`--shadow-xs` → `--shadow-xl`) plus two amber-tinted variants (`--shadow-amber-sm/md/lg` + dark variants) for CTA emphasis — shadows are a first-class token, not ad hoc per-component values.
- Sidebar has its OWN token sub-namespace: `--color-sidebar`, `-foreground`, `-primary`, `-primary-foreground`, `-accent`, `-accent-foreground`, `-border`, `-ring` — distinct from the generic `--color-*` set.
- Chart colors: 5-step `--chart-1..5` token set.
- `--success` / `--warning` exist as first-class semantic colors (no mosaic equivalent, see §2).
- Typography: fluid `clamp()` for h1/h2 (marketing-scale headings), fixed for h3/h4; `font-variant` not explicitly set for tabular nums in the scanned file (not verified beyond globals.css).
- Motion: named easing token `--ease-out-expo`, capped animation durations (100–600ms), `prefers-reduced-motion` handled at multiple sites, no bounce/elastic anywhere in `globals.css`.
- Decorative layer: `body::before` fixed noise-texture SVG overlay (analog-warmth pattern), `.hero-gradient`, `.grid-pattern`, `.text-gradient` (gradient text — flagged: this is the **AI-slop "gradient text" anti-pattern** in mosaic-blocks' own design charter, present in the reference app on marketing headline emphasis only, not on metrics/numbers — narrower usage, not a blanket violation).

### 1.2 Shell
- `app/[locale]/dashboard/layout.tsx`: shadcn `Sidebar` primitive (`SidebarProvider` / `SidebarInset` / `SidebarTrigger`) wraps `AppSidebar` + `DashboardHeader`. Desktop = persistent left panel; mobile = Sheet drawer via hamburger trigger.
- `components/app-sidebar.tsx` (492 lines): nav groups OVERVIEW (Dashboard, Chat, Missions, Architect) / WORKSPACE (Settings); no footer (org switcher + user profile moved to header, per file's own doc comment); active state = subtle `bg-sidebar-accent` fill (no border accent); touch targets `min-h-[44px]` enforced; hover-expand-from-collapsed via `data-hover-open` + `:has()` CSS selector (`.peer:has([data-hover-open])`).
- `components/dashboard/DashboardHeader.tsx` (370 lines): org switcher, credits display, language switcher, notification dot (`rounded-full bg-destructive` badge), user menu — all in the header, not the sidebar footer.

### 1.3 Patterns observed
- Buttons: pill-shaped in the Luma preset (`rounded-4xl`), press feedback via `active:translate-y-px` (not scale), all variants routed through `.cn-button` + `.cn-button-variant-*` classes that the active preset overrides.
- Badges: shadcn `Badge` with `variant="secondary"`, small text (`text-xs`), used inline next to labels — not templated icon-badges.
- Notification indicator: a bare positioned dot (`absolute rounded-full bg-destructive`), not a numbered badge.
- Cards: `.card-elevated` utility (justified elevation only — hover lift `translateY(-2px)` + shadow escalation), explicitly reserved by its own comment for "content truly distinct and actionable" — consistent with the project's own no-cardocalypse doctrine.
- Skeleton loading via `.skeleton` class family, not per-component ad hoc placeholders.

## 2. Gap table — reference-app element vs mosaic-blocks

| Reference-app element | mosaic-blocks equivalent | Gap | Effort |
|---|---|---|---|
| `--radius-sm/md/lg/xl/2xl/3xl/4xl` derived scale from one `--radius` base | No radius tokens at all in `src/styles.css` — components hardcode `rounded-md`, `rounded-[10px]` etc. per component | Missing token layer entirely; radius is compiled into component class strings, not swappable at the theme level | M |
| `--shadow-xs..xl` + amber CTA shadows | No shadow tokens in `src/styles.css`; `MosaicButton` outline variant uses bare `shadow-xs` (a Tailwind default, not a mosaic token) | Missing token layer | S |
| `--color-sidebar*` (8-var sub-namespace) | `MosaicAppSidebar.tsx` already CONSUMES `bg-sidebar`, `bg-sidebar-accent`, `text-sidebar-foreground`, `border-sidebar-border` classes, but `src/styles.css` defines NO `--color-sidebar-*` variables — a consuming app must supply them itself or the sidebar renders unstyled/falls back to Tailwind defaults | Token contract undocumented + unshipped; component assumes vars the package doesn't provide | S |
| `--chart-1..5` | Not present in `src/styles.css` | Missing — no chart-color-consuming component was found and audited in this pass (no `MosaicChart*` in the export census) | S (tokens only; chart components out of scope of this audit) |
| `--success` / `--warning` semantic colors | Not present in `src/styles.css`; `MosaicAppSidebar.tsx` hardcodes `text-green-500` for a status indicator instead of a semantic token | Missing token + at least one component bypassing tokens with a raw Tailwind color | S |
| Swappable style-preset system (6 named presets, body-class-gated, overriding `.cn-button`/`.cn-switch`/etc.) | `MosaicButton` is a single fixed CVA variant set (`buttonVariants` in `button-variants.ts`) — no preset/overlay mechanism | Structural gap: mosaic has ONE look, the reference app has SIX swappable looks via the same component API | L |
| Luma preset button: `rounded-4xl` (pill) + `active:translate-y-px` press | `MosaicButton` base: `rounded-md`, no active-press transform at all | Visual mismatch: square-ish corners vs pill, no press feedback | S–M (S if only matching Luma as new default; M if wiring the full preset system) |
| `.card-elevated` (justified-elevation-only utility, hover lift + shadow escalation, dark-mode variant) | No equivalent card-elevation utility found in `src/styles.css`; card components style shadow ad hoc if at all | Missing utility class + no documented "when to elevate" contract | S |
| `body::before` noise-texture overlay (page-level analog warmth) | Not present | Cosmetic-only; likely acceptable to skip or ship as an optional utility, not a component | S (optional) |
| `--ease-out-expo` named easing token used across ~10 keyframes | Not found as a named token in `src/styles.css` (mosaic components inline arbitrary durations/easings, e.g. `MosaicAppSidebar` injects its own `<style>` with `200ms ease-out`) | Missing shared easing token; each component reinvents its own timing constants | S |
| Notification dot (bare positioned `rounded-full bg-destructive` dot) | Not directly comparable — no dedicated "notification dot" primitive found in the export census; closest is `MosaicBadge` (full badge, not a bare dot) | Minor: no bare-dot indicator primitive | S |
| `DashboardHeader` (370 lines: org switcher + credits + i18n switcher + notif + user menu, single cohesive header) | `MosaicDashboardHeader.tsx` exists (own file, own stories/tests) — **not read in depth in this pass**; flagged as needing its own dedicated diff before a components PR is scoped, since header scope (credits display, i18n switcher) may not map 1:1 | Needs follow-up read before PR-2 (components) is scoped — do not assume parity | (scoping needed) |
| `AppSidebar` groups (OVERVIEW / WORKSPACE, no footer, hover-expand via `:has()`) | `MosaicAppSidebar.tsx` ships its own generalized nav-groups/quick-actions/recent-items/footer-status-slot API (props-driven, no hardcoded groups) — architecture is intentionally more generic (per its own doc comment: "generalized... fully props-driven") | Not a defect — mosaic's version is deliberately more abstract for reuse. Gap is in the DEFAULT visual treatment (colors/spacing/hover-expand behavior), not the API shape | M |

## 3. Ordered PR plan (tokens → components → theme, per direction)

1. **PR-1 — Tokens** (`src/styles.css`): add the missing token layer only, no component changes.
   - `--radius-sm/md/lg/xl/2xl/3xl/4xl` derived from one `--radius` base (mirror the `calc()` pattern).
   - `--shadow-xs/sm/md/lg/xl` (neutral scale first; amber/accent-tinted variants deferred to PR-3 theme work since they're preset-specific, not base tokens).
   - `--color-sidebar` + 7 sibling sidebar vars (both light and `[data-theme="dark"]` blocks, matching the existing two-block structure in `src/styles.css`).
   - `--color-chart-1..5`.
   - `--success` / `--warning` semantic colors (light + dark).
   - `--ease-out-expo` as a shared CSS custom property.
   - Effort: S. No breaking change — additive tokens only, existing consumers unaffected.

2. **PR-2 — Components**: consume the new tokens; fix at least one token-bypass defect found in this audit.
   - `MosaicAppSidebar.tsx`: replace hardcoded `text-green-500` with the new `--success` token (concrete, already-identified defect, not speculative).
   - `MosaicButton` / `button-variants.ts`: add a `.card-elevated`-equivalent utility OR document its absence as a deliberate choice (per the "declared divergence, not a silent gap" rule) — decide in review, not in this audit.
   - `MosaicDashboardHeader.tsx`: dedicated read-and-diff against `components/dashboard/DashboardHeader.tsx` BEFORE scoping any code change — flagged above as not yet compared line-by-line; do not assume parity from the export existing.
   - Effort: M (bounded by the diff work above, which has not been done yet).

3. **PR-3 — Theme / preset system**: the large structural item.
   - Decide (with Pi/Laurent, not unilaterally): does mosaic-blocks adopt the reference app's SIX-preset body-class-overlay mechanism, or does it ship ONE default look matching Luma only (the reference app's current default preset per `globals.css` import order — `base.css` first, then all six style files unconditionally, with the active look controlled by a runtime `PresetLoader` component this audit did not trace)?
   - If "one look matching Luma": land `rounded-4xl` pill buttons + `active:translate-y-px` press as the new `MosaicButton` default. Effort: S.
   - If "full preset system": port the `.cn-*` overlay-class architecture. Effort: L — this is the item requiring the most upfront design decision before any code is written.

## 4. What this audit did NOT do (explicit, per read-only scope)

- No component code was created or modified.
- No screenshots were captured (explicitly flagged in §Provenance, not silently omitted).
- `MosaicDashboardHeader.tsx`, `MosaicDashboardLayout.tsx`, `MosaicChatSidebar.tsx`, and the remaining ~90 exported components were NOT individually diffed against their reference-app counterparts — only the shell (sidebar, header, layout), buttons, badges, and the token file were read in depth. A full per-screen component diff (dashboard/chat, dashboard/architect, dashboard/missions, dashboard/account, dashboard/configurator, onboarding/create, sign-in/sign-up) is out of scope for this pass and should be a follow-up task if PR-2 needs finer granularity than stated above.
- No decision was made on the PR-3 preset-system question — it is surfaced for Pi/Laurent, not resolved here.

---

Orchestrator: Gamma — VantageOS Team | 2026-07-16
