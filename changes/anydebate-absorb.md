# Changelog Fragment — anydebate-absorb

**Branch:** `gamma/anydebate-absorb`
**Task:** T1 — UI-shell portage (mosaic-blocks-absorb-anydebate-v1)
**Date:** 2026-06-27

## Added components (11)

### PC-01 — MosaicDeviceProvider
`src/components/device-provider/MosaicDeviceProvider.tsx`

Responsive device context provider. Exports: `MosaicDeviceProvider`, `useDevice`, `useBreakpoint`, `useIsMobile`, `useIsTablet`, `useIsDesktop`, `useViewport`, `useOrientation`. SSR-safe. Foundation for all adaptive components.

### PC-02 — MosaicAdaptiveGrid
`src/components/adaptive-grid/MosaicAdaptiveGrid.tsx`

Device-aware CSS grid wrapper. Reads breakpoint from `useDevice()` and applies mobile/tablet/desktop column counts via inline CSS (no JIT dynamic class issues). Props: `mobileColumns`, `tabletColumns`, `desktopColumns`, `gap`.

### PC-03 — MosaicAdaptiveModal
`src/components/adaptive-modal/MosaicAdaptiveModal.tsx`

Unified modal/sheet. Native `<dialog>` element (browser focus trap, Escape via cancel event). Desktop: centered dialog. Mobile: bottom-sheet slide-up. No Radix/Vaul dependency. Props: `isOpen`, `onClose`, `title`, `children`, `description`.

### PC-04 — MosaicAdaptiveNavigation
`src/components/adaptive-navigation/MosaicAdaptiveNavigation.tsx`

Step navigation. Desktop: horizontal tab strip. Mobile: expandable accordion with step indicators and checkmarks. Props: `items[]` (id, title, duration?, isComplete?, children?), `activeItem`, `onItemChange`, `expandedItems`, `onToggleExpanded`.

### PC-05 — MosaicDashboardLayout
`src/components/dashboard-layout/MosaicDashboardLayout.tsx`

Full-height app shell. Sticky header (title, subtitle, breadcrumbs, actions slot). Persistent sidebar on desktop. Hamburger + `MosaicAdaptiveModal` drawer on mobile. `renderLink` escape hatch for router consumers. Zero hardcoded branding.

### PC-06 — MosaicAppSidebar
`src/components/app-sidebar/MosaicAppSidebar.tsx`

Collapsible sidebar (64px icon-only / 280px expanded). Supports nested submenus, quick actions section, recent items section, footer status pill. Full-width on mobile when inside modal. All content via props: `navItems[]`, `quickActions[]`, `recentItems[]`, `logoSlot`, `footerStatus`.

### PC-07 — MosaicQuickActionCard
`src/components/quick-action-card/MosaicQuickActionCard.tsx`

Grid of action cards with 6 accent color presets (yellow, blue, green, purple, orange, cyan, gray). CSS stagger reveal on mount. `renderLink` escape hatch. Props: `actions[]` {id, title, description, icon, href, accent?}, `heading`, `columns`.

### PC-08 — MosaicActivityFeed + MosaicActivityItem
`src/components/activity-feed/MosaicActivityFeed.tsx`

Activity feed with CSS stagger-reveal rows. Status badges (active/completed/archived). Participant avatar stack (initials fallback). Message count + timestamp. `iconMap` prop for type → icon mapping. `renderLink` for "View All". Both components exported standalone.

### PC-09 — MosaicAgentComposerDesktop
`src/components/agent-composer/MosaicAgentComposerDesktop.tsx`

Two-column composer (desktop half). Left: scrollable form with 4 module slots + name + custom instructions. Right: live preview panel. Fully controlled — no internal state. Generalized: `MosaicComposerModule` + `MosaicComposerModel` types (no domain coupling). `labels` prop for i18n/rename.

### PC-10 — MosaicAgentComposerMobile
`src/components/agent-composer/MosaicAgentComposerMobile.tsx`

Single-column composer (mobile half). Sticky header + sticky CTA bar. Numbered module slots. `isLoading` prop. Full ARIA attributes (aria-required, aria-invalid, aria-describedby). Same props contract as Desktop + `isLoading` extension.

### MosaicAgentComposer (orchestrator)
`src/components/agent-composer/MosaicAgentComposer.tsx`

Responsive-pair orchestrator. Reads `isMobile` from `useDevice()` and delegates to `MosaicAgentComposerDesktop` or `MosaicAgentComposerMobile`. Codifies the canonical responsive-pair pattern from the upstream source.

### PC-11 — MosaicModuleCard
`src/components/module-card/MosaicModuleCard.tsx`

Selected-module display card. Used inside AgentComposer slots. Shows name, description, optional detail string, emoji icon, tags (up to 4), edit/remove action buttons. `MosaicModuleData` generic type — no debate domain types.

---

## Technical notes

- **Framer-motion**: fully eliminated. All animations use CSS keyframes + `animation-delay` stagger (precedent: `MosaicAnimatedList`). Every animation respects `prefers-reduced-motion`.
- **lucide-react**: not added. All icons are inline SVG.
- **next/link / next/navigation**: not added. Components use `<a>` by default; `renderLink` prop available for router-aware consumers.
- **Radix/Vaul**: not added. `MosaicAdaptiveModal` uses native `<dialog>` element.
- **forwardRef**: zero usage — React 19 ref-as-prop throughout.
- **Debate domain types**: fully stripped. Generalized to `MosaicComposerModule`, `MosaicComposerModel`, `MosaicActivity`, `MosaicNavigationItem`, etc.

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-27*
