---
name: vantage-design-system
description: VantageOS design system conventions for building or reviewing UI in EveVantage and fleet apps. Use when adding a new UI component, scaffolding a new app shell, choosing color tokens, wiring the EN/FR switcher or dark/light toggle, or before claiming a UI change is "done". Triggers on "new component", "new page", "new app", "design tokens", "dark mode", "light mode", "language switcher", "i18n toggle", "screenshot", "visual proof", "blank page", "empty state".
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
be wrong within days. Derive it from the artifact, every time:

```bash
grep -o "^export { Mosaic[A-Za-z0-9]*" src/index.ts | sed 's/^export { //' | sort -u
```

Run this in the `mosaic-blocks` repo root before adding any new component.
If a name in that list already covers your use case (even partially),
extend or compose it — do not write a parallel implementation.

## 2. App shell template: reuse, don't rebuild

The reference app shell (sidebar, dark/light toggle, EN/FR switcher, card
layout) already exists. Base every new app's shell on it instead of
building one from scratch:

- Repo: `vantage-registry`
- Branch: `fix/orgscope-personal-workspaces`

Pull that branch, read the shell components it contains, and adapt — do
not reinvent sidebar navigation, the theme toggle, or the locale switcher.

## 3. Tokens: OKLCH, dark/light, EN/FR by default

- Color tokens are OKLCH (see `../better-colors/SKILL.md` and
  `../better-colors/gamut-and-tailwind.md` for conversion, palette
  generation, and contrast rules — do not restate that guidance here).
- Every new screen ships both a dark and a light variant. Neither is
  optional; neither is an afterthought bolted on later.
- Every new screen ships an EN/FR switcher by default (see the reference
  shell in point 2). Bilingual is the starting state, not a follow-up task.

## 4. "Done" requires a visual proof on PROD — not just green tests

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

## 5. No blank page

A screen that renders with no content, no empty-state messaging, and no
clear next action is a defect, not an acceptable interim state — the same
"no blank page" principle applies to UI as it does to asset reuse
elsewhere: every state a screen can be in (loading, empty, error,
populated) needs a real treatment before the screen ships. Use
`MosaicEmptyState` (see point 1's derivation command) for the empty case
rather than shipping a blank container.
