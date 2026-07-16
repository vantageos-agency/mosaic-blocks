---
name: vantage-design-system
version: 1.1.0
description: VantageOS design system conventions for building or reviewing UI in EveVantage and fleet apps. Use when adding a new UI component, scaffolding a new app shell, choosing color tokens, wiring the EN/FR switcher or dark/light toggle, or before claiming a UI change is "done". Triggers on "new component", "new page", "new app", "design tokens", "dark mode", "light mode", "language switcher", "i18n toggle", "screenshot", "visual proof", "blank page", "empty state" — even if they don't say "design system" explicitly.
---

# VantageOS design system

This skill is project-specific. It does not replace `better-ui`,
`better-colors`, or `better-typography` in this directory (upstream,
general design-craft guidance, MIT, see `../ATTRIBUTION.md`) — it adds what
those cannot know: which components already exist in this codebase, which
shell to reuse, and what "done" requires for a UI delivery in this fleet.

## 1. `@vantageos/mosaic-blocks` components are exclusive for EveVantage and fleet apps

Every EveVantage screen and every fleet app (VantagePeers, VantageRegistry,
VantageCRM, etc.) MUST build its UI from `@vantageos/mosaic-blocks` exports.
**Do not recreate a component that already exists in the package.**

The exact, current list of exported components is not fixed in this
document — it changes as the package grows, and a number written here would
be wrong within days. Derive it from the **built bundle**, never from a
regex over the source file: a regex only knows the export forms its author
thought of (e.g. single-line `export { Mosaic... }`), and this codebase also
uses multi-line `export { \n  MosaicX,\n  MosaicY,\n} from "..."` blocks that
a naive grep silently misses — it would fail open, hiding real components
and causing the exact duplication this rule exists to prevent. The bundle
is the one artifact that reflects every export form, because it's what the
bundler itself resolved:

```bash
pnpm build   # required first — the command below reads dist/, not src/
node -e 'console.log(Object.keys(require("./dist/index.cjs")).filter(k=>/^Mosaic/.test(k)).sort().join("\n"))'
```

Run this in the `mosaic-blocks` repo root before adding any new component.
If a name in that list already covers your use case (even partially),
extend or compose it — do not write a parallel implementation.

## 2. App shell template: reuse, don't rebuild

The reference app shell (sidebar, dark/light toggle, EN/FR switcher, card
layout) already exists. Base every new app's shell on it instead of
building one from scratch:

- Repo: `vantage-registry`, on `main` — `apps/dashboard/components/`
  (layout/sidebar.tsx, layout/topbar.tsx with ThemeToggle,
  i18n/locale-switcher.tsx). Landed via merge commit
  `003710ebd618ad8548e945e1f933107e7cd50874`; the original feature branch
  no longer exists — derive from main, never from a branch name someone
  remembered.

Read those shell components and adapt — do not reinvent sidebar
navigation, the theme toggle, or the locale switcher.

## 3. Tokens: OKLCH, dark/light, EN/FR by default

- Color tokens are OKLCH (see `../better-colors/SKILL.md` and
  `../better-colors/gamut-and-tailwind.md` for conversion, palette
  generation, and contrast rules — do not restate that guidance here).
- Every new screen ships both a dark and a light variant. Neither is
  optional; neither is an afterthought bolted on later.
- Every new screen ships an EN/FR switcher by default (see the reference
  shell in point 2). Bilingual is the starting state, not a follow-up task.

## 4. The six styling rules — every JSX line in a consuming app

Distilled from a production-tested internal reference design system. A PR
that violates any of these on a touched line is non-conformant, whatever
the tests say.

Scope boundary: these rules bind APPLICATION code (EveVantage, fleet app
screens, anything consuming the design system). Design-system primitives
in this repo may legitimately carry arbitrary values or raw palette
classes — a primitive DEFINES the scale the rules point to. Inside a
primitive, a deliberate exception is declared in a code comment where it
sits; it is never silent.

1. **Always semantic tokens.** `bg-card text-card-foreground border-border`
   — never raw palette classes with dark variants bolted on
   (`bg-white dark:bg-gray-900`). If a semantic token is missing, add the
   token; do not inline a color.
2. **Tailwind scale over arbitrary values.** `p-4 gap-6 rounded-lg` — never
   `p-[16px] gap-[24px] rounded-[12px]`. An arbitrary value is a fork of
   the spacing scale.
3. **Gap over margin for spacing between siblings.** `flex gap-4` on the
   parent — never `mr-4`/`mb-4` chained on children. Margins couple
   siblings to their position; gap belongs to the layout.
4. **Mobile-first class order.** Base class first, breakpoints as
   enhancements: `w-full md:w-1/2 lg:w-1/3` — never desktop-first
   (`w-1/3 md:w-full`). The base layer is the phone.
5. **Compose class names with `cn()`.** `cn("w-full", isLoading &&
   "opacity-50", className)` — never template-string concatenation, which
   silently produces `"undefined"` fragments and breaks Tailwind merging.
6. **Variants over one-off class soups.** `<Button variant="outline"
   size="sm">` — never re-describing an existing variant inline
   (`className="border bg-transparent h-8 px-3"`). If the variant doesn't
   exist, add it to the component (CVA), don't fork it at the call site.

Review shortcut: `grep -nE '\[(1?[0-9])?[0-9]px\]|dark:bg-|dark:text-' <files>`
flags candidates for rules 1–2; read each hit in context before rejecting —
a legitimate arbitrary value is possible but must be argued in the PR, in
writing.

## 5. "Done" requires a visual proof on PROD — not just green tests

A passing e2e/functional test proves the DOM contains the right elements.
It proves nothing about how the screen actually renders — spacing,
contrast, overlap, broken responsive breakpoints, a token that resolves to
the wrong color at runtime. None of that shows up in a test assertion.

Before claiming a UI change is delivered:

1. Deploy or confirm the change is live on the PROD target.
2. Take an actual screenshot of the rendered PROD page (not a local dev
   server, not a component-in-isolation storybook render).
3. Attach or reference that screenshot as the evidence for "done".

"Tests are green" is not evidence of visual delivery. It is evidence that
the test suite is green — a narrower and different claim. State them
separately; never let one stand in for the other.

## 6. No blank page

A screen that renders with no content, no empty-state messaging, and no
clear next action is a defect, not an acceptable interim state — the same
"no blank page" principle applies to UI as it does to asset reuse
elsewhere: every state a screen can be in (loading, empty, error,
populated) needs a real treatment before the screen ships. Use
`MosaicEmptyState` (see point 1's derivation command) for the empty case
rather than shipping a blank container.
