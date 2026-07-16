---
name: mobile-first
version: 1.0.0
description: >
  Mobile-first architecture and progressive enhancement for web apps:
  breakpoints, touch-target floors, adaptive components, device detection.
  Use this skill whenever building or reviewing a screen, layout, navigation,
  modal, form, or interactive element that must work on phones and tablets,
  or when choosing between responsive CSS, adaptive components, separate
  mobile/desktop views, or conditional rendering. Triggers on mobile,
  responsive, breakpoint, touch target, viewport, orientation, drawer,
  adaptive, device detection, "looks broken on mobile", 375px, progressive
  enhancement — even if they don't say "mobile-first" explicitly.
allowed-tools: ["Read", "Grep", "Glob"]
---

# Mobile-first architecture

Design for the smallest screen first (320px), then progressively enhance for
tablet (768px+) and desktop (1024px+) — because a desktop layout squeezed
down is always worse than a mobile layout grown up. Distilled from a
production-tested internal reference implementation: where this skill names
portable assets, REUSE that implementation, do not rewrite it.

## Quick Reference

| Concern | Rule |
| --- | --- |
| Breakpoints | `sm: 640px`, `md: 768px` (tablet), `lg: 1024px` (desktop), `xl: 1280px` |
| Button / link | min 44×44px (WCAG 2.1 Level AA) |
| Form input | min 48px height (prevents iOS auto-zoom) |
| Card / list item | min 80px height, ≥8px between touch targets |
| Class order | Mobile base first: `w-full md:w-1/2 lg:w-1/3` — never desktop-first |
| Test matrix | 320 / 375 / 768 / 1024 / 1440 px, both orientations |

## WORKFLOW

1. **Pick ONE of the four systems per need** — layout/styling only →
   responsive CSS (`p-4 md:p-6 lg:p-8`, no JavaScript). Same content,
   different presentation → adaptive component (modal on desktop / bottom
   drawer on mobile, tabs / accordion). Fundamentally different UX →
   separate `mobile/` and `desktop/` components sharing a core.
   Device-exclusive feature → conditional rendering
   (`{!isMobile && <Feature />}`), never for core functionality.
   Full decision trees: [decision-trees.md](references/decision-trees.md).
2. **Wire device state through ONE source of truth** — a single device
   context (provider + `useDevice()` exposing `isMobile / isTablet /
   isDesktop`, viewport, orientation). Components never run their own media
   queries in logic. Portable assets to reuse:
   [portable-assets.md](references/portable-assets.md).
3. **Size every touch target by the floors** — clickable 44×44px, input
   48px, card/list row 80px, ≥8px gaps. Modal vs drawer: form input or tall
   scrollable content → drawer on mobile; simple quick action → dialog
   everywhere.
4. **Validate against the checklist before claiming done** — all five
   breakpoints render, touch floors met, both orientations reflow cleanly,
   keyboard/focus/contrast pass, `prefers-reduced-motion` respected, 3G
   budgets met (FCP < 1.5s, LCP < 2.5s, CLS < 0.1, input delay < 100ms).

## RULES

- The base layer is mobile (320–767px); every screen must be fully usable at 320px.
- One source of truth for device state — no scattered `window.matchMedia` in components.
- Touch-first interactions: `active:scale-*` on mobile where desktop uses `hover:`.
- Orientation is a state, not an accident — portrait and landscape both tested.
- NEVER hide core functionality on mobile as a shortcut.
- NEVER add the "mobile version" at the end of a build — it is the base.
- NEVER size touch targets by eye — the 44/48/80px floors are the law.
- NEVER write desktop-first class order (`w-1/3 md:w-full`).

## Additional resources

- Decision trees (which system, modal vs drawer, touch sizing): [references/decision-trees.md](references/decision-trees.md)
- Portable reference assets to reuse (device provider, hooks, adaptive components): [references/portable-assets.md](references/portable-assets.md)
