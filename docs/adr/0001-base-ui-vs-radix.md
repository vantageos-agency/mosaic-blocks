# ADR-0001 — Adopt @base-ui/react for Batch C Interactive Atoms

| Field       | Value                        |
|-------------|------------------------------|
| **Status**  | Accepted                     |
| **Date**    | 2026-06-15                   |
| **Deciders**| Gamma (orchestrator), Laurent Perello (pilot) |
| **Branch**  | `gamma/t0-arch-base-ui`      |

---

## Context

`@vantageos/mosaic-blocks` is building Batch C — the first production set of interactive React atoms:

> Button · Input · Select · Avatar · Field · Combobox · DropdownMenu · Switch · InputGroup · Card · Badge

These atoms are **lit-ui** styled (Tailwind v4, `data-slot` attribute API, no class merging at runtime) and must satisfy:

- **React 19** native (no legacy compat shims)
- **Accessibility** — ARIA roles, keyboard navigation, focus management out of the box
- **Headless** — no bundled CSS, fully owned styling via Tailwind v4
- **Port fidelity** — we use `heyfabrika/styleui` (MIT) as the reference implementation

Two candidate headless libraries were evaluated: **@radix-ui/react** (current market incumbent) and **@base-ui/react** (next-gen, 2025–2026).

---

## Decision

**Adopt `@base-ui/react@^1.5.0` as the headless primitive layer for all Batch C interactive atoms.**

Radix UI is explicitly rejected for this batch. Styling-only atoms (Card, Badge) use plain JSX with Tailwind — no headless lib needed for those.

---

## Rationale

### 1. Source fidelity — near-zero porting effort

The reference implementation (`heyfabrika/styleui`) is built **100% on `@base-ui/react`**. Its Button uses `ButtonPrimitive` from `@base-ui/react/button`, its Input uses `@base-ui/react/input`, etc.

Using Radix would require a **per-component adaptation layer**: swap primitives, re-test ARIA semantics, re-validate keyboard behavior, handle the `asChild` → render-prop migration. For an 11-atom batch that would be 11 × N rework cycles with no upside.

With @base-ui, the port is **import swap + namespace rename** — the variant logic, `data-slot` API, and class structure carry over directly.

### 2. Architecture alignment — React 19 native + `data-slot` API

| Feature                    | @radix-ui/react        | @base-ui/react@1.5.0         |
|----------------------------|------------------------|-------------------------------|
| React 19 native            | Partial (compat layer) | Yes (built on React 19)       |
| Render API                 | `asChild` (clone)      | `render` prop + `useRender`   |
| State exposure             | CSS data-attributes    | `data-*` state attrs (same)   |
| Slot attribution           | `asChild` composition  | `data-slot` (our convention)  |
| shadcn stated future       | Historical default     | **Stated next reference**     |
| Maintained by              | workos/Radix team      | Base UI / MUI team            |
| Version stability          | Stable, frozen API     | Active, 1.x stable since 2025 |

The `data-slot` pattern used by styleui and mosaic-blocks aligns naturally with @base-ui's component conventions. Radix's `asChild` pattern would add indirection that conflicts with our `in-data-[slot=...]` Tailwind variant selectors.

### 3. Ecosystem trajectory

shadcn/ui has publicly indicated @base-ui as its future primitive layer. Since mosaic-blocks targets the shadcn registry format (`registry.json`), using @base-ui ensures forward compatibility when shadcn completes that migration.

### 4. No existing Radix investment

mosaic-blocks has **zero** existing Radix dependencies. There is no migration cost, no consumer breakage, no lock-in to preserve.

---

## Per-Primitive Availability in @base-ui/react@1.5.0

Verified via `node_modules/@base-ui/react/package.json` exports manifest (2026-06-15):

| Batch C Atom   | @base-ui/react export     | Available? | Notes                                      |
|----------------|---------------------------|------------|--------------------------------------------|
| Button         | `@base-ui/react/button`   | **YES**    | `Button` with `focusableWhenDisabled`      |
| Input          | `@base-ui/react/input`    | **YES**    | Integrates with Field                      |
| Select         | `@base-ui/react/select`   | **YES**    | Full combobox-style select                 |
| Avatar         | `@base-ui/react/avatar`   | **YES**    | Root + Image + Fallback                    |
| Field          | `@base-ui/react/field`    | **YES**    | Field + Label + Control + Error + Hint     |
| Combobox       | `@base-ui/react/combobox` | **YES**    | Full Combobox primitive                    |
| DropdownMenu   | `@base-ui/react/menu`     | **YES**    | Menu + Trigger + Positioner + Item etc.    |
| Switch         | `@base-ui/react/switch`   | **YES**    | Switch + Thumb                             |
| InputGroup     | None (composing Input)    | **COMPOSE**| Plain div wrapper; Input is the atom       |
| Card           | None                      | **STYLE-ONLY** | Styling primitive — plain `<div>` + Tailwind |
| Badge          | None                      | **STYLE-ONLY** | Styling primitive — plain `<span>` + Tailwind |

**Summary:** 8 of 11 atoms have direct @base-ui/react primitives. InputGroup is a layout composer (plain div wrapping Input). Card and Badge are styling-only — no headless lib needed or appropriate; they are `<div>`/`<span>` + Tailwind variants.

No Batch C atom requires a missing primitive. No fallback to Radix is needed.

---

## Risks

### R1 — Ecosystem breadth vs Radix
**Risk:** @base-ui has fewer community tutorials, third-party wrappers, and Stack Overflow answers than Radix (which launched ~2021).

**Mitigation:** Official @base-ui docs are comprehensive. styleui provides a reference implementation for every primitive we need. Radix primitives remain available as an escape hatch for any hypothetical gap in Batch D+.

**Residual risk:** LOW — all Batch C primitives confirmed present.

### R2 — API stability at 1.x
**Risk:** @base-ui hit 1.0 in late 2024. The `render` prop API and state attribute conventions may shift in 1.x minor releases.

**Mitigation:** We pin `^1.5.0` in `versions.ts`. Breaking changes in `render` prop behavior would require adaptation, but the `data-slot` surface we use is stable.

**Residual risk:** LOW-MEDIUM — 1.x semver guards against breaking changes.

### R3 — Bundle size
**Risk:** @base-ui is modular (per-primitive sub-paths). If consumers import the root barrel, tree-shaking may be inconsistent.

**Mitigation:** mosaic-blocks imports from sub-paths (`@base-ui/react/button`, not `@base-ui/react`). tsup is configured with `treeshake: true`. Per-primitive bundle impact is minimal (~2–4 KB per primitive gzipped).

**Residual risk:** LOW — sub-path imports + tree-shaking confirmed.

### R4 — motion / animation budget
**Risk:** @base-ui does not bundle animation. Any motion (e.g. Drawer, Dialog open/close) requires explicit CSS transitions or an external library.

**Mitigation:** Batch C atoms (Button, Input, Select, Switch, etc.) do not require complex enter/exit animations. If motion is needed for Drawer/Dialog in Batch D, we evaluate `motion` (Framer Motion v12) at that point.

**Residual risk:** NONE for Batch C.

---

## Consequences

### Positive
- Batch C ports are **near-direct** from styleui: import swap + namespace rename
- No `asChild` indirection — `data-slot` convention works cleanly
- React 19 native — no compat shims
- Forward-compatible with shadcn's stated @base-ui migration
- All 11 Batch C atoms covered (8 headless + 2 style-only + 1 compose)

### Negative / Accepted trade-offs
- `class-variance-authority` added as a production dependency (lightweight, ~3 KB)
- Less community tooling vs Radix — docs must be self-sufficient
- Card/Badge documented explicitly as "style-only, no headless lib" to avoid confusion

### Policy going forward
1. **All interactive Batch C atoms** use `@base-ui/react/<primitive>` as the headless base.
2. **Styling-only atoms** (Card, Badge, Separator) use plain HTML elements + Tailwind variants — no headless lib.
3. **`data-slot` is the attribution API** — every atom root sets `data-slot="<atom-name>"`.
4. **versions.ts is the single source of truth** — `@base-ui/react` version pinned there, synced via `pnpm sync-versions`.
5. **Radix** is available as an emergency per-primitive fallback if @base-ui lacks a future primitive. Document the exception in a new ADR.

---

## References

- [@base-ui/react docs](https://base-ui.com/react)
- [heyfabrika/styleui source (MIT)](https://github.com/heyfabrika/styleui) — reference implementation
- [shadcn/ui base-ui migration notes](https://ui.shadcn.com)
- `src/versions.ts` — pinned dependency catalog
- `registry.json` — shadcn registry format

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-15*
