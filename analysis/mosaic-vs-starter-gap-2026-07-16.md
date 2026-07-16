# mosaic-blocks vs reference-app UI gap audit

**Scope**: read-only visual/structural audit. Zero code changed by this document.
**Direction (decision, already made)**: align mosaic-blocks tokens/components on the reference app's look. The reference app is NOT rewritten.

## Provenance (state, resolved at audit time — re-derive before acting on this later)

- Reference app SHA actually audited: **`5fcc2459eda4384882245790c885c071098b0420`** (`origin/main`), read from a clean detached worktree (`git worktree add <tmp> origin/main`), NOT the dirty/stale local checkout (which sat on branch `audit/react-doctor-2026-05-29` at `a352aa4`, with uncommitted local edits). This SHA is a snapshot; the branch will move.
- mosaic-blocks SHA this document was written against: `f5a2e62467feb9a68117fae3ad49f3cd8b6d3e98` (branch `gamma/starter-gap-audit`, cut from `main` at `e3c4e61`).
- **RETRACTION 1 (Day of this audit, 2nd correction)**: the previous revision of this document derived the component inventory via `grep -o "^export { Mosaic[A-Za-z0-9]*" src/index.ts | sort -u | wc -l` → 111, and stated this was "derived, not typed from memory". **That grep is blind by construction**: it only matches single-line `export { Mosaic... }` statements and silently misses every multi-line export block (`src/index.ts` contains ~38 of them, e.g. `export {\n  MosaicTabs,\n  MosaicTabsList,\n} from "./components/tabs";`). The grep-based 111 undercounted the real export surface by roughly a third, and every "no equivalent found in the census" claim made against that 111 was therefore suspect by construction — see RETRACTION 2 below for the one that turned out to be actually false.
- **Corrected derivation method — build the bundle, then read `Object.keys()` off the compiled artifact, never grep the TS source**:
  ```
  pnpm build && node -e 'console.log(Object.keys(require("<repo>/dist/index.cjs")).filter(k=>/^Mosaic/.test(k)).length)'
  ```
  Run on mosaic-blocks `f5a2e62467feb9a68117fae3ad49f3cd8b6d3e98`, in a fresh isolated worktree (`git worktree add <tmp> gamma/starter-gap-audit`, `pnpm install --frozen-lockfile`, `pnpm build`) — reproduced **twice independently** (once against the shared checkout's existing `dist/`, once against a from-scratch install+build in an isolated worktree): both runs printed **177**.
  - This number is intentionally NOT frozen as a fact going forward — re-run the command above before citing any export count in a future revision; `dist/` is gitignored and not part of this PR's diff, so it is not reproducible from the PR alone, only from re-running the build.
  - Pi's message cited **162** from the same command on the same SHA. I could not reproduce 162 — my own two independent runs both gave 177. I am reporting my own measured, twice-reproduced number rather than copying Pi's figure on trust (the exact discipline Pi is enforcing here); the discrepancy itself is flagged, not resolved, since I cannot inspect Pi's environment. If 177 vs 162 matters for a decision, it should be re-settled by both parties running the identical command in the identical repo state before that decision is made.
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
| `--chart-1..5` | Not present in `src/styles.css` | Missing — re-verified against the corrected 177-export bundle inventory (not the retracted 111-grep census): `grep -i "chart"` on the bundle export list returns zero matches. This "missing" survives re-verification. | S (tokens only; chart components out of scope of this audit) |
| `--success` / `--warning` semantic colors | Not present in `src/styles.css`; `MosaicAppSidebar.tsx` hardcodes `text-green-500` for a status indicator instead of a semantic token | Missing token + at least one component bypassing tokens with a raw Tailwind color | S |
| Swappable style-preset system (6 named presets, body-class-gated, overriding `.cn-button`/`.cn-switch`/etc.) | `MosaicButton` is a single fixed CVA variant set (`buttonVariants` in `button-variants.ts`) — no preset/overlay mechanism | Structural gap: mosaic has ONE look, the reference app has SIX swappable looks via the same component API | L |
| Luma preset button: `rounded-4xl` (pill) + `active:translate-y-px` press | `MosaicButton` base: `rounded-md`, no active-press transform at all | Visual mismatch: square-ish corners vs pill, no press feedback | S–M (S if only matching Luma as new default; M if wiring the full preset system) |
| `.card-elevated` (justified-elevation-only utility, hover lift + shadow escalation, dark-mode variant) | No equivalent card-elevation utility found in `src/styles.css`; card components style shadow ad hoc if at all | Missing utility class + no documented "when to elevate" contract | S |
| `body::before` noise-texture overlay (page-level analog warmth) | Not present | Cosmetic-only; likely acceptable to skip or ship as an optional utility, not a component | S (optional) |
| `--ease-out-expo` named easing token used across ~10 keyframes | Not found as a named token in `src/styles.css` (mosaic components inline arbitrary durations/easings, e.g. `MosaicAppSidebar` injects its own `<style>` with `200ms ease-out`) | Missing shared easing token; each component reinvents its own timing constants | S |
| Notification dot (bare positioned `rounded-full bg-destructive` dot) | Not directly comparable — re-verified against the corrected 177-export bundle inventory: `grep -iE "notif|dot"` returns zero matches; closest is `MosaicBadge` (full badge, not a bare dot). This "missing" survives re-verification. | Minor: no bare-dot indicator primitive | S |
| `DashboardHeader` (370 lines: org switcher + credits + i18n switcher + notif + user menu, single cohesive header) | `MosaicDashboardHeader.tsx` exists (own file, own stories/tests) — **not read in depth in this pass**; flagged as needing its own dedicated diff before a components PR is scoped, since header scope (credits display, i18n switcher) may not map 1:1 | Needs follow-up read before PR-2 (components) is scoped — do not assume parity | (scoping needed) |
| `AppSidebar` groups (OVERVIEW / WORKSPACE, no footer, hover-expand via `:has()`) | `MosaicAppSidebar.tsx` ships its own generalized nav-groups/quick-actions/recent-items/footer-status-slot API (props-driven, no hardcoded groups) — architecture is intentionally more generic (per its own doc comment: "generalized... fully props-driven") | Not a defect — mosaic's version is deliberately more abstract for reuse. Gap is in the DEFAULT visual treatment (colors/spacing/hover-expand behavior), not the API shape | M |

## 2bis. Per-screen audit (read from JSX, screen by screen — required scope)

Every file below was opened and read directly on the audited SHA (`5fcc245`); none of this section is inferred.

### Screen: `dashboard` (`app/[locale]/dashboard/page.tsx`)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Credit-balance metric card (`.card-elevated`, icon-container, `tabular-nums` value) | No dedicated "metric card" export — re-verified against the corrected 177-export bundle inventory, no match; `MosaicStatsGrid` is the closest, not read in depth this pass | Not diffed at component-prop level; flagged, not silently skipped | (needs a dedicated diff before PR-2 scoping) |
| "Architect CTA" card with custom `<ui-button>` web-component tag, `btn-shadow active-scale rounded-full` | `MosaicButton` exists but the starter page uses a raw custom element `<ui-button>`, not the shadcn/mosaic `Button` — i.e. the reference app itself is inconsistent (mixes its own shadcn `Button` elsewhere with a `<ui-button>` custom element here) | Gap is partly IN the reference app, not only in mosaic — flag for Pi before treating this as a mosaic target | S (flag only) |
| Recent-sessions list (`bg-card border rounded-xl`, divider rows, empty state with icon + CTA link) | `MosaicSessionList` / `MosaicSessionCard` exist in the (corrected, build-derived) inventory | Not diffed prop-by-prop this pass | (follow-up) |
| Status badge with inline `oklch()` literal color (`border-[oklch(0.62_0.18_240)]/40`) bypassing the semantic token layer entirely | `MosaicBadge` uses only semantic `variant` classes, no raw oklch literal | Reference app itself has a token-bypass here (raw oklch, not `--chart-*`/`--primary`) — worth flagging back to the reference app's own team, not just a mosaic fix | S |

### Screen: `dashboard/chat` (`app/[locale]/dashboard/chat/page.tsx`, list view; `[chatId]/page.tsx` not opened this pass)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Chat list header with "new chat" button + inline SVG plus icon | `MosaicChatSidebar` / `MosaicChatThread` exist but this is a full-width LIST page, not a sidebar — no direct 1:1 export found for this specific list-page layout | Missing pattern: mosaic has thread/sidebar/composer atoms, not this "flat searchable chat list" page-level pattern | M |
| Search input with left icon overlay (`pointer-events-none absolute` icon inside `input`) | No dedicated "search input with icon" export — re-verified against the corrected 177-export bundle inventory, no match (`MosaicMemorySearch`/`MosaicMessageSearch` are domain-specific full-search components, not a generic icon-input primitive); closest generic candidate is `MosaicInputGroup`, not read in depth | Not diffed at prop level | (follow-up) |
| Project filter `<select>` with custom chevron overlay | No equivalent found in census — mosaic exports `MosaicSelect` (likely Radix-based, not a raw `<select>`) | Architecture difference: raw `<select>` + manual chevron vs (presumed) Radix `Select` — not confirmed without opening `MosaicSelect.tsx`, flagged not asserted | (follow-up) |
| Pinned/unpinned sort, pin icon, relative-date formatting (`formatDate`) | Not present as a component — this is page-level logic, not a component gap | N/A — logic difference, not a UI gap | — |

### Screen: `dashboard/architect` (`app/[locale]/dashboard/architect/page.tsx` + `_components/session-list.tsx`; `_components/chat-interface.tsx` not opened this pass)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Page header with `size-8 rounded-xl bg-muted` icon badge + title + "New session" text-link action | No direct export match found in census for this specific header pattern (closest: `MosaicDashboardHeader`, different scope — global header, not a per-page section header) | Missing pattern-level component (a reusable "page section header") | S–M |
| `WorkspaceLoading` / `NoWorkspace` / `EmptyState` (all three use the shared `.icon-container` utility + centered text stack) | `MosaicEmptyState` exists in the (corrected, build-derived) inventory | Not diffed prop-by-prop; `.icon-container` utility itself (2.5rem icon box, `bg-muted/50` at 50% mix) has no confirmed mosaic-side equivalent utility class | (follow-up on `MosaicEmptyState` diff; utility gap confirmed) |
| `StatusDot` with literal `oklch()` colors per status (active/completed/abandoned) | No "status dot" export found in census | Same token-bypass pattern as the dashboard-page badge — raw oklch literals recur at multiple sites in the reference app, not isolated to one file | S (token gap, recurring) |
| Session-list rows with relative-time formatting | `MosaicSessionList` exists | Not diffed prop-by-prop this pass | (follow-up) |

### Screen: `dashboard/missions` (`app/[locale]/dashboard/missions/page.tsx` + `components/missions/*.tsx`, 6 files / 965 lines total)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| `MissionsHeader` + `MissionFilters` + `ViewOptions` (board/list toggle) | No direct 1:1 export found in census for a "mission board header with filter + view-toggle" composite | Missing composite pattern (mosaic has `MosaicKanbanBoard`/`MosaicKanbanColumn` atoms, not the header/filter/toggle shell around them) | M |
| `MissionBoard` (drag-and-drop kanban, 5 fixed status columns: pending/executing/awaiting_checkpoint/completed/failed, native HTML5 drag events, optimistic local state before Convex mutation confirms) | `MosaicKanbanBoard` + `MosaicKanbanColumn` exist in the (corrected, build-derived) inventory | Column-count and status-vocabulary are domain-specific to the reference app (Convex mission schema) — **this is exactly the kind of business-specific vocabulary that must NOT be hardcoded into mosaic-blocks** per project doctrine; the gap to close is prop-driven column config, not literally these 5 statuses | M |
| `MissionListView` (alternate to board), `MissionStats` (245 lines — not opened in depth this pass) | `MosaicStatsGrid` (stats), no direct list-view export confirmed | `MissionStats` (245 lines) not read in depth — flagged, not silently skipped | (follow-up) |
| Loading spinner: raw inline SVG spin animation (`animate-spin`, two-path circle+arc), not `MosaicSkeleton` | `MosaicSkeleton` exists in census but this reference-app spot uses a spinner, not a skeleton — different loading-state pattern entirely | No "spinner" export found in the mosaic census | S |

### Screen: `dashboard/account` (`app/[locale]/dashboard/account/page.tsx` + `components/dashboard/account/AccountTabs.tsx`)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Custom tab implementation (own `TabId` union type + inline SVG icons per tab: profile/subscription/usage/notifications) — confirmed NOT the shadcn/Radix `Tabs` primitive (`grep` for `TabsList`/`TabsTrigger`/`<Tabs` in `AccountTabs.tsx` returned zero matches) | **RETRACTION 2 — FALSE CLAIM in the previous revision**: this document previously stated "`MosaicTabs` does not exist at all", based on the blind grep-on-source method described above. `MosaicTabs` DOES exist, along with `MosaicTabsList`, `MosaicTabsPanel`, `MosaicTabsTrigger` — confirmed present in the build-derived 177-export inventory (`grep -iE "tabs" <bundle-census>` → all four names). The gap is therefore NOT "missing component" but "reference-app account screen hand-rolls its own tabs instead of reusing the existing `MosaicTabs*` family" — not yet diffed prop-by-prop against `AccountTabs.tsx`'s actual tab set (profile/subscription/usage/notifications). | M — re-scoped: diff `MosaicTabs*` against `AccountTabs.tsx` before deciding whether the account screen needs a NEW component or a straight swap to the existing one |
| Page header skeleton (`animate-pulse` blocks matching final layout dimensions) | `MosaicSkeleton` exists | Not diffed prop-by-prop | (follow-up) |
| Individual tab content (`ProfileTab`, `SubscriptionTab`, `UsageCreditsTab`, `NotificationsTab` — the last explicitly dead-code-commented per a `biome-ignore` note in source, "used when Notifications tab is uncommented") | `MosaicProfilePanel`, `MosaicPreferencesPanel`, `MosaicApiKeyPanel` exist in census as plausible analogues | Not opened/diffed this pass — named here as candidates only, not confirmed matches | (follow-up) |

### Screen: `dashboard/configurator` (`app/[locale]/dashboard/configurator/page.tsx` + `components/design-system/customizer.tsx`, not opened)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Live design-system customizer: `Customizer` panel + `DesignSystemProvider` (URL-param-driven via `nuqs`), live color-swatch preview grid (8 swatches incl. `bg-chart-1`/`bg-chart-2`), button-variant preview row | **No equivalent found — re-verified against the corrected 177-export bundle inventory** (not the retracted 111-grep census): `grep -iE "customiz|design"` on the bundle export list returns zero matches; closest are `MosaicThemeProvider` / `MosaicThemeToggle`, which only toggle light/dark, not a full token customizer. This "missing" survives re-verification. | **Missing entirely** — this is the single largest component gap found in this audit: the reference app ships a live multi-axis (style/color/font/radius) design customizer; mosaic ships a binary theme toggle | L |

### Screen: `create` (`app/[locale]/create/page.tsx` — onboarding entry point)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Same "design system customizer" pattern as `dashboard/configurator`, but with ITS OWN separate `Customizer` + `DesignSystemProvider` under `components/create/` (confirmed by import paths — `@/components/create/customizer` vs `@/components/design-system/customizer` used by the dashboard route) | Same gap as above (no mosaic equivalent) | Reference app itself duplicates this feature across two independent component trees (`components/create/*` and `components/design-system/*`) — flagged as a reference-app-side observation, not a mosaic defect, but relevant to scoping: porting once vs twice | L (shared with configurator gap above) |
| Responsive layout: fixed sidebar customizer on desktop (`md:w-72 md:border-r`), horizontal scroll customizer bar on mobile (`md:hidden`) | N/A — no mosaic component to compare, per above | Same as above | — |

### Screen: `sign-in` / `sign-up` (`app/[locale]/sign-in/[[...sign-in]]/page.tsx`, `app/[locale]/sign-up/[[...sign-up]]/page.tsx`)
| Element | Mosaic equivalent | Gap | Effort |
|---|---|---|---|
| Both pages: fixed `bg-gray-950` (hardcoded Tailwind gray, NOT `bg-background` / any OKLCH semantic token), centered `max-w-md` column, `<SignIn>`/`<SignUp>` Clerk widget, translated title/subtitle above the widget | `MosaicSignInLayout` / `MosaicSignUpLayout` exist in the (corrected, build-derived) inventory (`src/components/auth/sign-in-layout`, `src/components/auth/sign-up-layout` — not opened in depth this pass) | Confirmed defect in the reference app itself: hardcoded `bg-gray-950` bypasses the entire OKLCH token/preset system described in §1 — this page does NOT follow the reference app's own design-token doctrine. Flag to Pi/Laurent: should mosaic's `MosaicSignInLayout`/`MosaicSignUpLayout` replicate this bypass (visual parity) or use `bg-background` (token-correct)? Not decided here. | S (decision needed before port) |

### Screens I could NOT complete a full component-level diff for, named explicitly (not silent)
- `dashboard/chat/[chatId]/page.tsx` (individual chat thread view) — page listed in the directory scan but its file contents were not opened this pass; the list-page (`chat/page.tsx`) was audited, the thread-detail page was not.
- `dashboard/architect/_components/chat-interface.tsx` — imported by `architect/page.tsx` and confirmed to exist, but its internals were not opened.
- `components/missions/mission-stats.tsx` (245 lines), `mission-filters.tsx` (286 lines), `mission-list-view.tsx`, `view-options.tsx`, `mission-column.tsx` — existence and line counts confirmed (`wc -l`), contents not opened line-by-line.
- `components/design-system/customizer.tsx` (dashboard/configurator) and `components/create/customizer.tsx` (create) — both confirmed to exist via import paths in the pages that use them; neither file's internals were opened, so the "Missing entirely" verdict above rests on the corrected build-derived mosaic-side inventory (confirmed absent, re-verified) cross-referenced with the PAGE-level JSX (confirmed present), not on a full read of the customizer component's own internals.
- `dashboard/account/tabs/{ProfileTab,SubscriptionTab,UsageCreditsTab,NotificationsTab}.tsx` — confirmed to exist via imports in `AccountTabs.tsx`, not opened individually.
- `MosaicDashboardHeader.tsx`, `MosaicDashboardLayout.tsx`, `MosaicChatSidebar.tsx`, `MosaicSignInLayout`/`MosaicSignUpLayout` internals, and the remaining mosaic-side exports not named above — not read in depth on the mosaic side; the build-derived inventory confirms existence, not prop/behavior parity.

Reason these were not completed: audit time budget for this pass. This list is the explicit follow-up scope for PR-2 fine-grained diffing — it is NOT a silent gap; every item above is named with the exact file path that still needs opening.

## 3. Ordered PR plan (tokens → components → theme, per direction)

1. **PR-1 — Tokens** (`src/styles.css`): add the missing token layer only, no component changes.
   - `--radius-sm/md/lg/xl/2xl/3xl/4xl` derived from one `--radius` base (mirror the `calc()` pattern).
   - `--shadow-xs/sm/md/lg/xl` (neutral scale first; amber/accent-tinted variants deferred to PR-3 theme work since they're preset-specific, not base tokens).
   - `--color-sidebar` + 7 sibling sidebar vars (both light and `[data-theme="dark"]` blocks, matching the existing two-block structure in `src/styles.css`).
   - `--color-chart-1..5`.
   - `--success` / `--warning` semantic colors (light + dark).
   - `--ease-out-expo` as a shared CSS custom property.
   - Effort: S. No breaking change — additive tokens only, existing consumers unaffected.

2. **PR-2 — Components**: consume the new tokens; fix concrete token-bypass defects found in this audit; complete the still-open per-screen diffs (§2bis "could not complete" list) before writing any component code.
   - `MosaicAppSidebar.tsx`: replace hardcoded `text-green-500` with the new `--success` token (concrete, already-identified defect).
   - Reference-app-side raw `oklch()` literals recur at ≥2 confirmed sites (dashboard-page status badge, architect session-list `StatusDot`) bypassing the reference app's OWN token system — flag back to the reference-app owners; mosaic should not copy this bypass, it should use the new `--chart-*`/semantic tokens from PR-1.
   - `MosaicButton` / `button-variants.ts`: add a `.card-elevated`-equivalent utility OR document its absence as a deliberate choice — decide in review.
   - **Corrected: `MosaicTabs`/`MosaicTabsList`/`MosaicTabsPanel`/`MosaicTabsTrigger` DO exist** (see RETRACTION 2 above — the earlier revision's "does not exist at all" claim was false, born from the blind source-grep method). Action item is now: diff `MosaicTabs*` against `AccountTabs.tsx`'s actual tab set (profile/subscription/usage/notifications) and decide whether the account screen swaps to the existing family or needs a variant of it — NOT "build a new Tabs primitive".
   - `MosaicDashboardHeader.tsx`, `MosaicChatSidebar.tsx`, `MosaicSessionList`, `MosaicEmptyState`, `MosaicKanbanBoard`/`MosaicKanbanColumn`, `MosaicSignInLayout`/`MosaicSignUpLayout`: each needs the dedicated line-by-line diff named in §2bis's "could not complete" list BEFORE its corresponding reference-app screen is ported — do not assume parity from the export existing.
   - Effort: M–L (bounded by the diff work listed in §2bis, none of which has been done yet).

3. **PR-3 — Theme / preset system + the two largest structural gaps found**
   - Decide (with Pi/Laurent, not unilaterally): does mosaic-blocks adopt the reference app's SIX-preset body-class-overlay mechanism, or does it ship ONE default look matching Luma only (the reference app's current default preset per `globals.css` import order — `base.css` first, then all six style files unconditionally, with the active look controlled by a runtime `PresetLoader` component this audit did not trace)?
     - If "one look matching Luma": land `rounded-4xl` pill buttons + `active:translate-y-px` press as the new `MosaicButton` default. Effort: S.
     - If "full preset system": port the `.cn-*` overlay-class architecture. Effort: L.
   - **Design customizer (`dashboard/configurator` + `create` screens)**: the reference app ships a live, URL-param-driven, multi-axis (style/color/font/radius) design-system customizer with zero equivalent — re-verified against the corrected 177-export bundle inventory, still absent (`MosaicThemeToggle` is light/dark only). This gap survives re-verification and remains the single largest component gap in the whole audit. Needs its own scoping decision — is this even in mosaic-blocks' scope, or does it stay reference-app-only? Effort: L, and possibly out-of-scope — flagged for Pi/Laurent, not decided here.
   - **Sign-in/sign-up hardcoded `bg-gray-950`**: both reference-app auth pages bypass the OKLCH token system entirely with a literal Tailwind gray, contradicting the reference app's own design doctrine described in §1. Decide: should `MosaicSignInLayout`/`MosaicSignUpLayout` replicate this (visual parity with what ships today) or correct it to `bg-background` (token-correct, diverges from current reference-app pixels)? Effort: S, decision-gated.

## 4. What this audit did NOT do (explicit, per read-only scope)

- No component code was created or modified.
- No screenshots were captured (explicitly flagged in §Provenance, not silently omitted).
- Every required screen (dashboard, dashboard/chat, dashboard/architect, dashboard/missions, dashboard/account, dashboard/configurator, create, sign-in, sign-up) was opened and read directly from its JSX — see §2bis for the full per-screen element/gap table.
- Within those screens, a named subset of files (thread-detail chat page, architect chat-interface, four mission sub-components, both customizer implementations, four account tab files, and several mosaic-side component internals) was confirmed to EXIST but not read line-by-line — the exact list is in §2bis "Screens I could NOT complete a full component-level diff for", not a silent gap.
- No decision was made on the PR-3 preset-system question, the design-customizer scope question, or the sign-in `bg-gray-950` question — all three are surfaced for Pi/Laurent, not resolved here.

## 5. Corrections log for this document (both retractions, named per rule)

1. **RETRACTION 1** — export count method: the source grep (`grep -o "^export { Mosaic..." src/index.ts`) is blind to multi-line export blocks and undercounted by roughly a third (111 vs the build-derived 177). Fixed derivation method now documented in §Provenance: build the bundle, read `Object.keys()` off the compiled `dist/index.cjs`, never grep the TS source.
2. **RETRACTION 2** — false claim "`MosaicTabs` does not exist at all", made against the retracted 111-count census. `MosaicTabs`/`MosaicTabsList`/`MosaicTabsPanel`/`MosaicTabsTrigger` all exist. Corrected in §2bis (account screen) and §3 (PR-2 plan).
3. Every remaining "missing" / "no equivalent found" claim in this document (chart tokens, notification-dot primitive, metric-card export, search-input-with-icon export, design-system customizer) was re-run against the corrected 177-export bundle inventory and confirmed to still hold — each such line now says explicitly "re-verified against the corrected 177-export bundle inventory" rather than citing the retracted grep-based count.

---

Orchestrator: Gamma — VantageOS Team | 2026-07-16
