# ADR-0002 — Finished Blocks Move onto @heroui/react 3.2.5; Relief + Motion Defined Once as Theme Data

| Field       | Value                                            |
|-------------|---------------------------------------------------|
| **Status**  | Proposed — pending Eta review and the operator showcase gate |
| **Date**    | 2026-09-16                                         |
| **Deciders**| Proposed by Gamma (mission pilot); decided at the operator showcase gate |
| **Branch**  | `feat/heroui-theme-depth`                          |
| **Supersedes / extends** | [`0001-base-ui-vs-radix.md`](./0001-base-ui-vs-radix.md) — does NOT replace it |

---

## Context

Three independent HeroUI theming trials were built as one-off screens outside `@vantageos/mosaic-blocks` — `vantageos-crm` PR #172 (`src/app/dashboard-v2-heroui.css`) and `pujol-reporting` PR #25 (`app/baux-v2/heroui.css`) — to evaluate `@heroui/react` (3.2.5, MIT, `react-aria`-based) as a source of pre-built, richer interactive blocks (data tables, calendars, command palettes, complex dropdowns) that `@base-ui/react` (ADR-0001) does not itself style or compose.

The operator's verdict on all three trials: **"flat, a mockup, no relief, no animation."**

Reading the trials against that verdict:

- `vantageos-crm` PR #172 (round 2, after the same feedback once already): built a real 4-step surface ladder, a shadow + inset-highlight elevation model, and `color-mix()`-derived nested-well shade — entirely **app-local**, scoped to one CSS file, imported by exactly one screen. Nothing about it is reusable by another consumer of `@vantageos/mosaic-blocks`.
- `pujol-reporting` PR #25: a 13-line CSS file that only reassigns 8 HeroUI base tokens to the app's existing palette. No surface ladder, no elevation, no motion tokens. This is the trial that reads as literally flat — it never defined "relief" as a concept.

Both trials prove the same thing from two directions: **depth and motion were being invented per-app, inconsistently, or not invented at all.** The `@vantageos/mosaic-blocks` package is the one place a consumer-facing definition belongs — it already owns the OKLCH semantic token layer (`docs/ARCHITECTURE.md` § Theme system, l.27) that both trial apps build their local theme on top of.

## Decision

1. **Relief and motion are defined once**, as CSS custom-property DATA in `@vantageos/mosaic-blocks` (`src/theme/depth.css`, imported by `src/styles.css`) — never as a per-component literal, never re-invented per consuming app. This ADR's companion change (T1) ships that data: a 4-step surface ladder, 3 elevation levels (shadow + highlight edge each), motion tokens (durations, easings, an entry preset, a hover-lift preset — all disabled under `prefers-reduced-motion`), and the previously-missing `danger` semantic triad wired alongside the existing `success`/`warning`.
2. **Finished, ship-ready composed blocks move onto `@heroui/react@3.2.5`** where HeroUI supplies meaningfully more than `@base-ui/react` does today — specifically, complex composed interaction patterns (data table, calendar/date-range, command palette, rich autocomplete/combobox with async loading) that `@base-ui/react` leaves fully unstyled and uncomposed.
3. **`@base-ui/react` remains the headless primitive layer for atoms** (ADR-0001 stands, unchanged). HeroUI is adopted as a second, narrower layer ABOVE it for a specific class of composed blocks — not a replacement.

This ADR does **not** itself add `@heroui/react` as a dependency of `@vantageos/mosaic-blocks` (per task scope) — it defines the theme data both layers will draw from and the per-primitive boundary, so the first real HeroU-based block (a follow-up task) has an unambiguous contract to build against.

---

## Per-primitive table — stays on @base-ui/react vs. moves to @heroui/react

| Primitive class | Examples | Stays on `@base-ui/react` | Moves to `@heroui/react` | Why |
|---|---|:---:|:---:|---|
| Simple interactive atoms | Button, Input, Select, Switch, Field, Avatar, Badge, InputGroup, Card | **STAYS** | | ADR-0001 fully covers these; near-zero porting cost from `heyfabrika/styleui`; no HeroUI advantage for a single-role primitive |
| Overlay/menu primitives | DropdownMenu, Combobox (single-select, sync options) | **STAYS** | | `@base-ui/react/menu` and `@base-ui/react/combobox` are complete and already ported; HeroUI's menu/autocomplete duplicate this with no net gain |
| Composed data table | sortable/filterable table with row selection | | **MOVES** | No `@base-ui/react` primitive exists; hand-rolling ARIA grid semantics (row/column navigation, selection announcements) is exactly the class of work `react-aria` (HeroUI's foundation) is built to close correctly on the first try |
| Calendar / date range picker | single date, range, presets | | **MOVES** | Same reasoning — `react-aria`'s `useCalendar`/`useDateRangePicker` implement locale-aware keyboard/screen-reader behavior that would otherwise be a multi-cycle port; no existing atom covers this at all |
| Command palette | `Cmd+K` fuzzy launcher | | **MOVES** | Composed pattern (search + virtualized list + keyboard nav + portal) with no `@base-ui/react` equivalent; HeroUI ships it complete |
| Async/virtualized autocomplete | remote-search combobox, large option sets | | **MOVES** | `@base-ui/react/combobox` handles the sync case; virtualization + async loading states are additive complexity HeroUI already solves |
| Drawer / side sheet | `MosaicDrawer` (`@base-ui/react/dialog`) — also the host of the T4 document side panel | **STAYS** | | Modal focus trap, scroll lock and portal are complete in `@base-ui/react/dialog`; the `pujol-reporting` #25 trial rebuilt it on HeroUI for looks only — relief and slide-in motion come from the depth tokens, not from swapping the primitive |
| Tabs | `MosaicTabs` (`@base-ui/react/tabs`) — Bail / Ligne / Comparer in the T4 panel | **STAYS** | | Roving tabindex and `aria-selected` already correct; #25 used HeroUI Tabs for styling, which the tokens now provide |
| Tooltip | `MosaicTooltip` (`@base-ui/react/tooltip`) | **STAYS** | | Single-role primitive, fully covered; no composed behaviour HeroUI would add |
| Popover | `MosaicPopover` (`@base-ui/react/popover`) | **STAYS** | | Positioning + dismissal complete in base-ui; #25's HeroUI Popover was a styling choice only |
| Alert dialog | `MosaicAlertDialog` (`@base-ui/react/alert-dialog`) | **STAYS** | | `role="alertdialog"` semantics and initial-focus rules already implemented; nothing to gain from a second authority |
| Landing / utility blocks (Batch A/B) | Navbar, HeroSplit, StatsGrid, Counter, ThemeToggle | **STAYS (unaffected)** | | Purely compositional, props-driven; no headless primitive underneath either way — this ADR does not touch them |

**Rule going forward:** a primitive moves to HeroUI only when no `@base-ui/react` export covers it (mirrors ADR-0001's own per-primitive availability check) AND the interaction pattern is genuinely composed (multi-part ARIA choreography), not merely "would be faster to reuse than to port." A single-role primitive (button, input, switch) never moves — that would fragment the `data-slot` convention (ADR-0001) across two unrelated attribute vocabularies for no behavioral gain.

---

## OKLCH token mapping — one authority per primitive

The trials showed the failure mode to avoid: `vantageos-crm` PR #172 redeclared HeroUI's own `--background`/`--foreground`/`--accent`/`--danger`/`--success`/`--warning` base names locally, per-app, to point at the app's existing palette. That pattern works exactly once, per app, and produces zero shared vocabulary. `@vantageos/mosaic-blocks` fixes the authority question centrally instead: **HeroUI's theme variables are mapped from the package's own `--mosaic-*` / semantic tokens, at the package level, so a HeroUI-based block and a `@base-ui/react`-based block read the identical values — one primitive never has two authorities.**

| HeroUI theme variable | Mosaic source (this package) | Notes |
|---|---|---|
| `--background` | `var(--mosaic-surface-ground)` | page ground, new T1 surface-ladder token |
| `--foreground` | `var(--foreground)` (existing alias → `--mosaic-color-foreground`) | unchanged, already OKLCH |
| `--surface` | `var(--mosaic-surface-card)` | HeroUI's "surface" concept = this package's "card" step |
| `--surface-secondary` | `var(--mosaic-surface-sidebar)` | HeroUI has no native "sidebar" concept; sidebar step reused here |
| `--overlay` | `var(--mosaic-surface-well)` | HeroUI's popover/menu backdrop = the most-recessed step (nested well) |
| `--accent` | `var(--accent)` (existing alias → `--mosaic-color-accent`) | unchanged |
| `--danger` | `var(--color-danger-500)` (T1-added, was the missing triad) | now wired, mirrors success/warning |
| `--success` | `var(--color-success-500)` | already wired (pre-T1) |
| `--warning` | `var(--color-warning-500)` | already wired (pre-T1) |
| `--border` | `var(--border)` (existing alias) | unchanged |
| `--focus` | `var(--ring)` (existing alias) | unchanged |
| HeroUI elevation/shadow utilities | `var(--mosaic-elevation-{1,2,3}-shadow)` / `-highlight` | T1-added; a HeroUI block requesting elevation reads the SAME three levels a `@base-ui/react` block would |
| HeroUI transition/animation durations | `var(--mosaic-motion-duration-entry)` / `-hover`, `var(--mosaic-motion-easing-entry)` / `-hover` | T1-added; both layers honor the same `prefers-reduced-motion` zeroing, defined once |

`--*-hover` / `--*-soft` / derived HeroUI tokens are left to HeroUI's own `color-mix()` computation (as PR #172 already did correctly) — only the base tokens above need an explicit mosaic mapping; the derived ones recompute automatically once the base is set.

**A HeroUI-based block never declares its own `--background`/`--accent`/etc. locally.** It consumes the mapping above, in a package-level HeroUI theme wiring layer (to be added at the point the first HeroUI block ships) — never in the app, never per-block. This is the structural fix for the exact drift the two trials each demonstrated independently.

---

## Consequences

### Positive
- Relief (surface ladder + elevation) and motion (durations, easings, presets, reduced-motion contract) exist ONCE, tested (`src/__tests__/theme-depth.test.ts`), and are available to every future block regardless of which primitive layer it is built on.
- The `danger` semantic gap (present in `@vantageos/mosaic-tokens` canonical values since the package's inception, never wired into this package's consumer-facing `@theme inline` layer) is closed as a byproduct — `bg-danger-500` etc. now exist alongside `bg-success-500` / `bg-warning-500`.
- HeroUI is scoped narrowly (composed patterns with no `@base-ui/react` equivalent), so ADR-0001's `data-slot` convention and near-zero-porting-cost rationale for the existing 132 components is entirely undisturbed.
- The OKLCH mapping table gives the first HeroUI-block implementer an unambiguous contract instead of a third independent app-local reinvention.

### Negative / accepted trade-offs
- `@heroui/react` is NOT added as a dependency by this task — the mapping is defined ahead of the first consumer, which carries a small risk the mapping needs adjustment once real HeroUI component CSS is wired against it. Accepted: cheaper to adjust a documented table than to have let a third app invent its own local theme.
- Two headless-primitive layers now coexist in one package (`@base-ui/react` + eventually `@heroui/react`). Mitigated by the per-primitive table above being the single decision authority — a contributor does not choose per-component, they look up the class.
- `react-aria` (HeroUI's foundation) is a materially larger dependency than `@base-ui/react` for the primitives it will cover; acceptable because it is scoped to primitives that would otherwise require hand-built ARIA choreography of comparable or greater cost.

### Risks

**R1 — theme mapping drift.** If a future HeroUI block bypasses the mapping table and redeclares a base token locally (the exact failure both trials exhibited), the "one authority per primitive" guarantee breaks silently.
*Mitigation:* the mapping table above is the referenced source for the eventual package-level HeroUI wiring layer; a future guard test (out of scope here) can assert no `.stories.tsx` or component file under HeroUI-block paths declares `--background`/`--accent`/etc. locally.
*Residual risk:* MEDIUM until that guard exists — tracked as follow-up, not blocking this ADR.

**R2 — bundle size.** `react-aria`/`react-stately` add meaningfully to bundle size versus `@base-ui/react` alone.
*Mitigation:* HeroUI adoption is scoped to the composed-block class only (per the table); simple atoms never pull it in. Consumers who need zero HeroUI-block usage incur zero additional bytes (tree-shaken, per ADR-0001 R3 precedent).
*Residual risk:* LOW — scoping is the mitigation, and it is structural (the per-primitive table), not a promise.

---

## References

- [`0001-base-ui-vs-radix.md`](./0001-base-ui-vs-radix.md) — the primitive layer this ADR extends, not replaces
- `docs/ARCHITECTURE.md` § Headless primitive layer (l.17) and § Theme system (l.27)
- [@heroui/react docs](https://heroui.com/en/docs/react/getting-started) — 3.2.5, MIT, `react-aria`-based
- Trial evidence: `elpiarthera/vantageos-crm` PR #172 @ `58bfbf157f9ce2c6bdb8958922b38bfe55f05369` (`src/app/dashboard-v2-heroui.css`), `elpiarthera/pujol-reporting` PR #25 @ `9025bec77051441c469b0eef2fce23957f9e0498` (`app/baux-v2/heroui.css`)
- `src/theme/depth.css` — the relief + motion token data this ADR's companion change ships
- `src/__tests__/theme-depth.test.ts` — the guard proving the token contract by parsing the shipped CSS

---

*Orchestrator: Gamma — VantageOS Team | 2026-09-16*
