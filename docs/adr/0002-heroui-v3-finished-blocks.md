# ADR-0002 — Finished Blocks Move onto @heroui/react 3.2.5; Relief + Motion Defined Once as Theme Data

| Field       | Value                                            |
|-------------|---------------------------------------------------|
| **Status**  | Proposed (amended 2026-09-16 on the HeroUI scope ruling) — pending Eta review and the operator showcase gate |
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

**Amended 2026-09-16 on the coordinator's ruling (task `k17284qvsrzpjdpgj3h3nw1hk58egc8g`, re-pin):** the operator's decision is "use HeroUI" for **finished blocks** — not "HeroUI for the data table only", which is what the first draft of this ADR narrowed it to. That narrowing is why the first T3 blocks imported zero HeroUI and still read flat.

1. **Relief and motion are defined once**, as CSS custom-property DATA in `@vantageos/mosaic-blocks` (`src/theme/depth.css`, imported by `src/styles.css`) — never as a per-component literal, never re-invented per consuming app: a 4-step surface ladder, 3 elevation levels (shadow + highlight edge), motion tokens (durations, easings, entry and hover-lift presets, all zeroed under `prefers-reduced-motion`), and the `danger` status utility next to `success`/`warning`.
2. **`@heroui/react` v3 is a real dependency of the package.** Every finished block is **composed from HeroUI components** (Card, Chip, Table, Drawer, Tabs, Button, Tooltip, ListBox, Toolbar, SearchField, Meter, Skeleton, Avatar…), themed through the token bridge below. A block never hand-rolls a replacement for a component HeroUI provides.
3. **`@base-ui/react` stays only for atoms HeroUI does not provide**, and for the existing 132 components until each is replaced by a HeroUI-composed finished block. ADR-0001 stands for that remaining scope.
4. **Where HeroUI provides nothing, the gap is named, not papered over.** Read from the published package (`@heroui/react@3.2.5`, `ls dist/components` -> 88 components): there is **no navbar, no sidebar, no chart, no PDF viewer and no splitter**. The app shell is composed from Surface + ListBox + Link + Tooltip + Button + Avatar (sidebar) and Toolbar + SearchField + Button + Dropdown (top bar); only SVG chart geometry, `MosaicPdfViewer` and `MosaicResizableSplitPane` remain ours.
5. **Landing order.** This PR carries the decision and the token data only. The `@heroui/react` dependency, its stylesheet and the token-bridge CSS land with the first blocks that import it (the T3 rebuild), then T4 — one PR in gate at a time.

---

## Per-block composition — which HeroUI components each finished block uses

| Finished block | Composed from (`@heroui/react`) | Stays ours | Why |
|---|---|---|---|
| App shell — sidebar | Surface, ListBox / ListBoxItem (single selection = active item), Link, Tooltip (collapsed labels), Button (collapse), Avatar (brand mark), Separator | — | HeroUI ships no sidebar; ListBox gives the selection + keyboard semantics a hand-rolled nav list would re-implement |
| App shell — top bar | Toolbar, SearchField, Button (theme toggle), Dropdown (language), Avatar (user) | — | HeroUI ships no navbar; Toolbar gives the grouped, arrow-key-navigable bar |
| KPI tile | Card (Header / Content / Footer), Chip (trend; « Non raccordé » state), Skeleton (loading), Tooltip | SVG sparkline geometry | No HeroUI chart primitive |
| Stage chart | Card, Meter (one per stage, accessible value), Chip (Gagné / Perdu), Tooltip; Table for the accessible fallback | — | Meter carries `role="meter"` semantics a div bar lacks |
| Data table | Table (Root, ScrollContainer for sticky header, Header, SortableColumnHeader, Body, Row with react-aria selection, Cell, ColumnResizer), Chip (Statut), Checkbox, Pagination | — | react-aria grid semantics (row/column navigation, selection announcements) |
| Document side panel | Drawer (Content, Header, Heading, Body, Footer, CloseTrigger), Tabs (Bail / Ligne / Comparer), ButtonGroup + Button (« Comparer », « Ouvrir dans Drive »), Separator | `MosaicPdfViewer`, `MosaicResizableSplitPane` (compare mode) | HeroUI ships no PDF viewer and no splitter |
| Simple atoms not yet superseded | — | Existing `@base-ui/react` components (Button, Input, Select, Switch, Field, DropdownMenu, Combobox, Tooltip, Popover, AlertDialog, Drawer, Tabs) | Kept until a finished block replaces each; a new finished block uses the HeroUI component, never the base-ui one |

**Rule going forward:** a new finished block imports the HeroUI component for every part HeroUI provides. A part may stay hand-built only when the published HeroUI package has no component for it, and that absence is written in this table.

---

## Token bridge — one authority per value

The trials showed the failure mode to avoid: `vantageos-crm` PR #172 redeclared HeroUI's own base variables locally, per app. `@vantageos/mosaic-blocks` fixes the authority centrally: **HeroUI's theme variables are mapped from this package's tokens at the package level**, so a HeroUI block and any remaining base-ui atom read identical values. Variable names below are read from `@heroui/styles` `dist/heroui.min.css`, not recalled.

| HeroUI theme variable | Mosaic source (this package) | Notes |
|---|---|---|
| `--background` | `var(--mosaic-surface-ground)` | page ground, step 1 of the ladder |
| `--foreground` | `var(--foreground)` | unchanged |
| `--surface` | `var(--mosaic-surface-card)` | cards, KPI tiles, table |
| `--surface-secondary` | `var(--mosaic-surface-sidebar)` | sidebar step |
| `--surface-tertiary` | `var(--mosaic-surface-well)` | nested wells (icon wells, table header band) |
| `--surface-shadow` | `var(--mosaic-elevation-1-shadow)`, `var(--mosaic-elevation-1-highlight)` | resting cards |
| `--overlay` / `--overlay-shadow` | `var(--mosaic-surface-card)` / `var(--mosaic-elevation-3-shadow)` | drawer, popover, dropdown |
| `--accent` / `--accent-soft` / `--accent-soft-foreground` | `var(--accent)` and its soft pair | selected table row = accent-soft surface + accent-soft-foreground text, contrast >= 4.5:1 asserted in both modes |
| `--success*` / `--danger*` / `--warning*` | `var(--color-success-500)` / `var(--color-danger-500)` / `var(--color-warning-500)` | soft variants derived by HeroUI for chips |
| `--border` / `--separator` / `--focus` | `var(--border)` / `var(--border)` / `var(--ring)` | unchanged |
| `--default-transition-duration` / `--default-transition-timing-function` | `var(--mosaic-motion-duration-hover)` / `var(--mosaic-motion-easing-hover)` | zeroed under `prefers-reduced-motion` by the same rule as the depth tokens |
| `--radius` / `--radius-xl` | `var(--radius)` | unchanged |

`--*-hover` / `--*-soft-hover` variants are left to HeroUI's own derivation once the base is set.

**A block never declares a HeroUI base variable locally.** The bridge lives once, in the package, shipped with the first HeroUI-importing blocks.

---

## Consequences

### Positive
- Relief and motion exist once, tested (`src/__tests__/theme-depth.test.ts`), for every block.
- Finished blocks inherit HeroUI's react-aria behaviour (selection, keyboard, focus, overlays) instead of re-implementing it, and the operator's "flat mockup" verdict is answered by composed components on shared depth tokens rather than per-screen styling.
- The token bridge gives every HeroUI block one contract; no app re-declares HeroUI variables.

### Negative / accepted trade-offs
- Two component layers coexist until the existing base-ui components are superseded. Mitigated by the per-block table being the decision authority: a new finished block always uses HeroUI for parts HeroUI provides.
- `@heroui/react` pulls react-aria, react-aria-components and `@heroui/styles` (peer and direct dependencies read from its package.json), materially larger than base-ui alone. Accepted by the operator's decision.
- The bridge is specified here before the first HeroUI block exists; adjustments may follow when real component CSS is wired. It is adjusted in this table, never locally.

### Risks

**R1 — bridge bypass.** A block redeclaring a HeroUI base variable locally breaks the single authority silently. *Mitigation:* a guard asserting no component or story under `src/components` declares `--background`, `--surface*`, `--accent*`, `--overlay*`, `--danger*`, `--success*` or `--warning*` ships with the bridge.

**R2 — hand-rolled parts creeping back.** A block re-implements something HeroUI provides. *Mitigation:* each finished block file must import `@heroui/react` (task verification: `git grep "@heroui/react"` non-empty per block file), and any hand-built part must appear in the "Stays ours" column above.

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
