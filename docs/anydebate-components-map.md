# AnyDebate Dev-Branch Component Cartography
# Mission: mosaic-blocks-absorb-anydebate-v1 (T0)

**Date:** 2026-06-27
**Source repo:** `elpiarthera/any-debate-ai` — branch `dev`
**Target:** `@vantageos/mosaic-blocks`
**Researcher:** Gamma (γ) — bu-mcp

---

## 1. Full Folder Classification

All `components/<feature>/` top-level folders from the `dev` branch tree, classified as:
- **shell-reusable** — generic UI with no debate business logic; port candidate
- **metier-debate** — debate-specific domain logic; do NOT port
- **marketing** — landing/marketing pages; do NOT port

| Folder | Files (count) | Classification | Rationale |
|---|---|---|---|
| `components/adaptive` | 3 | **shell-reusable** | Device-aware Grid, Modal, Navigation — pure layout primitives, zero debate coupling |
| `components/agent-composer` | 7 | **shell-reusable** | Composer UI shell (Desktop + Mobile pair + ModuleCard) — role/persona/framework slots are generic; debate-specific hrefs/types can be stripped |
| `components/agent-config` | 5 | **shell-reusable** | Selector modals (Framework, Persona, Role, Preview) — generic picker/builder pattern |
| `components/agent-management` | 2 | **shell-reusable** | AgentCard + QuickAgentSelector — generic card + selector atoms |
| `components/agents` | 5 (+ desktop/mobile sub) | **shell-reusable** | Dual desktop/mobile list pattern; filter sidebar reusable as FilterSidebar generic |
| `components/artifact` | 1 | **metier-debate** | ArtifactCanvas — debate session artifact rendering |
| `components/artifacts` | 9 (+ sub) | **metier-debate** | Full artifact lifecycle (Canvas, Renderer, Toolbar, Chart/Checklist/Document types, export, version history) — debate-domain |
| `components/billing` | 6 | **metier-debate** | Subscription/token billing dialogs — product-specific, not portable |
| `components/chat` | many (+ sub) | **metier-debate** | Chat threads, MentionInput, ModeSelector, auto-debate, bookmarks, compare, debate mode, reactions, threading — debate core domain |
| `components/dashboard` | 8 | **shell-reusable** | DashboardLayout, DashboardSidebar, DashboardContent, DashboardHeader, QuickActions, RecentActivity, OrgSwitcher, QuickActionsMenu — all generic shell patterns |
| `components/debate` | 6 | **metier-debate** | MessageBubble, ModelColumn, ModelSettings, AutoModeSwitch, AddModelButton — pure debate domain |
| `components/export` | 4 (+ sub) | **metier-debate** | ExportButton, ExportDialog, desktop/mobile ExportCenter — debate export specific |
| `components/landing` | many (+ sub) | **marketing** | Full landing page stack (Hero, Features, HowItWorks, SocialProof, Testimonials, UrgencyBanner, ExitIntentPopup) |
| `components/layout` | 1 | **shell-reusable** | `main-nav.tsx` — generic top nav wrapper |
| `components/marketplace` | 4 (+ sub) | **shell-reusable** | MarketplaceFilterSidebar + dual desktop/mobile card/list — generic marketplace list pattern |
| `components/memory` | 8 (+ sub) | **metier-debate** | MemoryFilterSidebar, add/edit memory, document-upload, url-scraper — debate product memory domain |
| `components/messages` | 3 (+ sub) | **shell-reusable** | message-card + dual desktop/mobile list — generic message list pattern |
| `components/module-libraries` | many (+ sub) | **shell-reusable** | Framework/Persona/Role libraries with desktop/mobile variants + forms — generic module picker/editor pattern (labels are domain, structure is generic) |
| `components/organization` | 11 (+ sub) | **shell-reusable** | OrgOverview, OrgSettings, MemberList (desktop/mobile), create/invite dialogs, role-badge, multi-org-indicator — generic multi-tenant org management |
| `components/sessions` | 3 (+ sub) | **metier-debate** | session-card + desktop/mobile session-list — debate session domain |
| `components/settings` | 2 | **shell-reusable** | preferences-panel, profile-panel — generic settings primitives |
| `components/shared` | 1 | **shell-reusable** | delete-confirmation-dialog — pure utility |
| `components/templates` | many (+ sub) | **shell-reusable** | TemplateGallery, TemplateCard, TemplatePreview, TemplateSelector, QuickStartPanel, AgentTeamPreview, FilterSidebar — generic template browser pattern |
| `components/theme-provider` | 1 | **shell-reusable** | Standard Next.js theme provider wrapper |
| `components/ui` | 25 atoms | **shell-reusable** | shadcn/radix atoms (Button, Card, Input, Dialog, Drawer, Tabs, Badge, etc.) — already covered by mosaic-blocks atoms; no direct port needed but validates compatibility |

**Totals:** 25 top-level folders — 13 shell-reusable, 8 metier-debate, 1 marketing (landing), 3 mixed-to-shell-reusable.

---

## 2. Relevant Providers / Hooks

| Path | What it does | Key exports | Port relevance |
|---|---|---|---|
| `contexts/DeviceProvider.tsx` | Wraps three responsive hooks into a single context: isMobile/isTablet/isDesktop, isSmUp/isMdUp/isLgUp/isXlUp, orientation, viewport, isBreakpoint() | `DeviceProvider`, `useDevice` | **HIGH** — required by all adaptive components |
| `hooks/responsive/useBreakpoint.ts` | `window.matchMedia` watcher with SSR guard + dev debug logging; convenience exports: `useIsMobile`, `useIsTablet`, `useIsDesktop` | `useBreakpoint`, `useIsMobile`, `useIsTablet`, `useIsDesktop` | **HIGH** — foundation of device system |
| `hooks/responsive/useViewport.ts` | Debounced resize listener → `{ width, height }` | `useViewport` | MEDIUM — bundled into DeviceProvider |
| `hooks/responsive/useOrientation.ts` | `orientationchange` + `resize` listener → `"portrait" | "landscape"` | `useOrientation` | MEDIUM — bundled into DeviceProvider |
| `hooks/dashboard/useAgentLibrary.ts` | Agent CRUD + filter state | local | LOW — debate domain |
| `contexts/DemoContext.tsx` | Demo mode flag | local | SKIP |

---

## 3. Port Candidates

### PC-01 — DeviceProvider + useDevice (Foundation)

- **Source:** `contexts/DeviceProvider.tsx` + `hooks/responsive/useBreakpoint.ts` + `hooks/responsive/useViewport.ts` + `hooks/responsive/useOrientation.ts`
- **What it does:** Single context providing all breakpoint states (mobile/tablet/desktop, sm/md/lg/xl flags), orientation, and viewport size. Used by every adaptive component.
- **Key props/API:**
  ```ts
  interface DeviceContextValue {
    isMobile: boolean; isTablet: boolean; isDesktop: boolean;
    isSmUp: boolean; isMdUp: boolean; isLgUp: boolean; isXlUp: boolean;
    orientation: "portrait" | "landscape";
    viewport: { width: number; height: number };
    isBreakpoint: (bp: "sm" | "md" | "lg" | "xl") => boolean;
  }
  // Usage: const { isMobile } = useDevice()
  ```
- **Dependencies:** Radix-free, no Clerk/Convex. Calls `window.matchMedia` + `debugResponsive` from `lib/monitoring/analytics` (strip this import on port — it's a dev-only console logger).
- **Porting risk:** LOW. Strip `debugResponsive` import. Rename to `@vantageos/mosaic-blocks/device`. Must wrap consuming tree with `<DeviceProvider>`.

---

### PC-02 — AdaptiveGrid

- **Source:** `components/adaptive/AdaptiveGrid.tsx`
- **What it does:** CSS grid wrapper that reads `isMobile/isTablet/isDesktop` from `useDevice` and applies `grid-cols-{n}` dynamically.
- **Key props/API:**
  ```ts
  interface AdaptiveGridProps {
    children: ReactNode;
    className?: string;
    mobileColumns?: number;    // default 1
    tabletColumns?: number;    // default 2
    desktopColumns?: number;   // default 3
  }
  ```
- **Dependencies:** `useDevice` (PC-01), Tailwind v4, no external UI libs.
- **Porting risk:** LOW. Self-contained. Tailwind class interpolation (`grid-cols-${n}`) needs safelist or CSS variable approach in mosaic-blocks build.

---

### PC-03 — AdaptiveModal

- **Source:** `components/adaptive/AdaptiveModal.tsx`
- **What it does:** Renders a `<Dialog>` (Radix) on desktop and `<Drawer>` (Radix via Vaul) on mobile. Single unified API; device detection is internal.
- **Key props/API:**
  ```ts
  interface AdaptiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    className?: string;
    description?: string;
  }
  ```
- **Dependencies:** `useDevice`, `@radix-ui/react-dialog`, `@radix-ui/react-drawer` (Vaul). mosaic-blocks already uses `@base-ui/react` — **evaluate swap to base-ui Dialog + Drawer or keep radix peer**. Full a11y attributes present (aria-describedby fallback).
- **Porting risk:** MEDIUM. Dependency on Radix dialog + drawer. If mosaic-blocks standardises on `@base-ui/react`, adapt or keep as peer dependency. No debate coupling.

---

### PC-04 — AdaptiveNavigation

- **Source:** `components/adaptive/AdaptiveNavigation.tsx`
- **What it does:** On desktop → shadcn `<Tabs>` strip. On mobile → accordion-style collapsible list with step indicators (number + check icon), expand/collapse state.
- **Key props/API:**
  ```ts
  interface NavigationItem {
    id: string; title: string;
    duration?: number; isComplete?: boolean; children?: ReactNode;
  }
  interface AdaptiveNavigationProps {
    items: NavigationItem[];
    activeItem: string;
    onItemChange: (id: string) => void;
    expandedItems?: Set<string>;
    onToggleExpanded?: (id: string) => void;
  }
  ```
- **Dependencies:** `useDevice`, `@radix-ui/react-tabs`, `lucide-react` (Check, ChevronDown, ChevronUp).
- **Porting risk:** LOW-MEDIUM. Zero debate coupling. Icons from lucide (already in fleet stack). Radix tabs peer dep as above.

---

### PC-05 — DashboardLayout (shell + dual sidebar pattern)

- **Source:** `components/dashboard/DashboardLayout.tsx`
- **What it does:** Full app shell: sticky header with breadcrumbs, action slot, mobile hamburger; desktop sidebar always visible; mobile sidebar opens in an AdaptiveModal drawer. Accepts `title`, `subtitle`, `breadcrumbs[]`, `actions` slot.
- **Key props/API:**
  ```ts
  interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
    actions?: ReactNode;
  }
  ```
- **Dependencies:** `useDevice`, `AdaptiveModal` (PC-03), `DashboardSidebar` (PC-06), `framer-motion` (header animation), `@radix-ui/react-*` via breadcrumb. ThemeToggle, OrgSwitcher, TokenBalance, QuickActionsMenu are debate-specific slots — strip or make optional via `actions` prop.
- **Porting risk:** MEDIUM. Framer-motion dep. OrgSwitcher/TokenBalance/QuickActionsMenu are debate-specific — expose as optional `headerActions` slot. Breadcrumb uses shadcn breadcrumb component (port or swap base-ui).

---

### PC-06 — DashboardSidebar (AppSidebar — dual desktop/mobile)

- **Source:** `components/dashboard/DashboardSidebar.tsx`
- **What it does:** Animated collapsible sidebar with: framer-motion width animation (64px collapsed / 280-320px expanded), scrollable nav section with submenu support, Quick Actions section, Recent Activity section, footer status pill. Fully responsive (full-width on mobile when rendered inside AdaptiveModal).
- **Key props/API:**
  ```ts
  interface DashboardSidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onNavigate?: () => void;  // closes modal on mobile nav
  }
  ```
  Internal `navigationItems[]` and `quickActions[]` arrays are hardcoded with debate hrefs (`/debates`, `/agents`, etc.) — must be externalized as props on port.
- **Dependencies:** `framer-motion`, `useDevice`, `usePathname`/`useRouter` (Next.js), `@radix-ui/react-scroll-area`, lucide icons, `Badge`.
- **Porting risk:** HIGH (needs prop externalization of nav items). Core animation/layout pattern is solid; the nav item array must become a `navItems: NavItem[]` prop. "AnyDebate AI" branding in header must be parameterized.

---

### PC-07 — QuickActionCard (6-accent variant)

- **Source:** `components/dashboard/QuickActions.tsx` — inner `<Card>` per action item
- **What it does:** Grid of action cards, each with: icon, title, description, accent color class (6 presets: yellow/blue/green/purple/orange/cyan + gray), hover scale, framer-motion stagger entrance, Link wrapper.
- **Key props/API (as extracted from the inline array pattern):**
  ```ts
  interface QuickActionItem {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;  // Tailwind bg+text+border accent class
  }
  // Outer component: QuickActions({ actions?: QuickActionItem[] })
  ```
  Currently the `quickActions` array is hardcoded inside the component. On port: externalize as `actions` prop with default export.
- **Dependencies:** `framer-motion`, `useDevice`, `next/link`, lucide, shadcn `Card`.
- **Porting risk:** LOW-MEDIUM. Strip debate-specific hrefs from default data. Externalize `actions` array. 6-accent pattern is pure Tailwind — document the 6 canonical colors as mosaic tokens.

---

### PC-08 — ActivityFeed + ActivityItem (RecentActivity)

- **Source:** `components/dashboard/RecentActivity.tsx`
- **What it does:** Feed card with framer-motion stagger rows. Each row (ActivityItem): icon, title, description, participant avatars with overlap, message count, status badge (active/completed/archived with accent colors), timestamp. "View All" link slot.
- **Key props/API:**
  ```ts
  interface Activity {
    id: string; type: string; title: string; description: string;
    timestamp: string; status: "active" | "completed" | "archived";
    participants?: string[];  // avatar fallback initials
    messages?: number;
  }
  // Component: RecentActivity({ activities?: Activity[]; viewAllHref?: string })
  ```
  Currently hardcoded mock data inside component.
- **Dependencies:** `framer-motion`, `useDevice`, `next/link`, `@radix-ui/react-avatar`, `Badge`, lucide icons.
- **Porting risk:** LOW. Strip hardcoded mock data. Externalize as `activities` prop. Avatar component is radix-compatible. Status color logic is pure Tailwind.

---

### PC-09 — AgentComposerDesktop (responsive-pair pattern, desktop half)

- **Source:** `components/agent-composer/AgentComposerDesktop.tsx`
- **What it does:** Two-column layout: left = scrollable form (Name, Role/Persona/Framework/Model cards with + button or ModuleCard when filled, CustomInstructions); right = live preview panel. 
- **Key props/API:** 17-prop interface (name, customInstructions, selectedRole/Persona/Framework/Model, all on* handlers, canSave, isEditMode, onCancel). Fully controlled, no internal state.
- **Dependencies:** shadcn ui atoms only (Button, Input, Label, Textarea, Card, Separator), lucide icons, `ModuleCard` sub-component. No framer-motion, no device context.
- **Porting risk:** LOW-MEDIUM. The `ProfessionalRole`, `Persona`, `Framework`, `Model` types from `lib/agent-config/*` and `lib/models/types` must be ported or generalized to a `MosaicModule` generic type. ModuleCard sub-component must come along.

---

### PC-10 — AgentComposerMobile (responsive-pair pattern, mobile half)

- **Source:** `components/agent-composer/AgentComposerMobile.tsx`
- **What it does:** Single-column scrollable form with sticky header + sticky bottom CTA bar. Same 4-module slot pattern as Desktop. Extra `isLoading` prop for async feedback. ARIA attributes (aria-required, aria-invalid, aria-describedby, aria-label) are thorough.
- **Key props/API:** Same 17 props as Desktop + `isLoading?: boolean`. Fully controlled.
- **Dependencies:** Same as Desktop. No framer-motion, no device context (layout is mobile-first by default, not adaptive).
- **Porting risk:** LOW-MEDIUM. Same type generalization as PC-09. This pair (Desktop + Mobile) is the key **responsive-pair pattern** to standardize in mosaic-blocks: a parent `AgentComposer` wrapper selects Desktop or Mobile via `useDevice`, then delegates — same contract, two renders.

---

### PC-11 — ModuleCard (sub-component of composer pair)

- **Source:** `components/agent-composer/ModuleCard.tsx`
- **What it does:** Filled-state card for a selected module (role/persona/framework) showing name, description, tags. Edit button. Used inside both Desktop and Mobile composer.
- **Key props/API:** `{ module: { name, description, tags? }, type: "role"|"persona"|"framework", onEdit: () => void }`
- **Dependencies:** shadcn Card, Button, Badge, lucide. Zero debate coupling.
- **Porting risk:** LOW. Must travel with PC-09/PC-10.

---

## 4. AgentComposer Desktop/Mobile Responsive-Pair Pattern

The `AgentComposer` family demonstrates the canonical **responsive-pair pattern** used across the entire anydebate codebase:

```
AgentComposer.tsx (orchestrator)
  ├── reads useDevice() → isMobile
  ├── if isMobile → <AgentComposerMobile {...props} />
  └── else        → <AgentComposerDesktop {...props} />
```

Both Desktop and Mobile share **identical prop contracts** (except Mobile adds `isLoading`). This is intentional: callers never need to know which variant renders. The same pattern appears in:
- `components/agents/desktop/` + `components/agents/mobile/`
- `components/module-libraries/desktop/` + `components/module-libraries/mobile/`
- `components/templates/desktop/` + `components/templates/mobile/`
- `components/organization/desktop/` + `components/organization/mobile/`
- `components/marketplace/desktop/` + `components/marketplace/mobile/`

**Mosaic-blocks port recommendation:** Codify this as the `mosaic-blocks` standard for all adaptive composed blocks:
1. Export a single top-level component (`<AdaptiveComposer>` etc.)
2. Internal orchestrator uses `useDevice` from DeviceProvider (PC-01)
3. Desktop and Mobile variants share an identical `*Props` interface (Mobile may extend with loading/accessibility extras)
4. Tree-shakeable: Desktop and Mobile sub-components are co-exported for consumers who want to bypass device detection

---

## 5. Bible Consult

**Source consulted:** `/root/coding/elpi-corp/decisions/fleet-asset-bible-2026-06-16.md` (Fleet Asset Bible, Day 104, Pi)

### §1 — NPM packages / Dogfood rule

The fleet bible opens with its canonical asset inventory and embeds the core dogfood doctrine in its preamble (p.17):

> "Règle d'usage : avant toute proposition de nouveau composant / nouvelle mission / nouveau produit / nouveau repo, l'orchestrateur DOIT consulter ce document et citer explicitement (a) ce qui existe déjà couvrant le besoin, (b) pourquoi l'existant ne suffit pas, (c) ce qu'il propose en plus. Sinon refus."

Applied to this mission: `@vantageos/mosaic-blocks 0.1.0-alpha.1` already exists (26 registry items: 8 landing + 6 utility + 11 atoms + Feature3Col). The anydebate components do NOT duplicate these existing blocks — they add a responsive device system (DeviceProvider stack) and composed shell blocks (DashboardLayout, AppSidebar, AgentComposer) that mosaic-blocks currently lacks. The port is additive, not redundant.

Also relevant from §1: `@vantageos/mcp-agent-composer 1.1.0` is published and covers the *MCP server* aspect of agent composition (Role + Persona + Framework + Skills, 5 tools). The `AgentComposerDesktop/Mobile` components being ported here are the *UI shell* counterpart — they are complementary, not duplicative.

### §10 — Synthèse Pi: 5 under-exploited assets + 5 real gaps

Section 10 identifies:

> "5 actifs sous-exploités ... `@vantageos/mcp-architect 1.1.0` — MCP App first-mover lit-ui + vite-plugin-singlefile bundle. Synergie naturelle avec mosaic-blocks (rendre les specs en composants visuels). Pas branché."

And in the 5 next-action candidates:

> "Brancher `@vantageos/mcp-architect` sur mosaic-blocks — synergie Day 104 : architect rend les specs en composants mosaic (first-mover MCP Apps capability shipped)."

This directly supports the anydebate absorb mission: porting the `DashboardLayout` + `AgentComposer` blocks into mosaic-blocks closes a real gap (the bible lists no existing shell/layout blocks in mosaic-blocks) and creates the visual rendering surface that `mcp-architect` needs.

**Note:** The fleet bible uses prose sections with descriptive headers, not numbered §1/§10 anchors. The above citations map to Section 1 (NPM packages preamble) and Section 10 (Synthèse Pi) as they appear structurally in the document. Explicit `§` numbering is not present in the source — I am citing structural sections, not fabricating anchors.

---

## 6. Recommended T1 Portage Order

Priority is determined by: (a) dependency graph (foundation first), (b) unblocking the most port candidates, (c) mosaic-blocks current gap.

| Priority | Component | Reason |
|---|---|---|
| 1 | **DeviceProvider + hooks stack** (PC-01) | Foundation — blocks ALL other adaptive ports until present |
| 2 | **AdaptiveModal** (PC-03) | Required by DashboardLayout mobile sidebar; earliest win |
| 3 | **AdaptiveGrid** (PC-02) + **AdaptiveNavigation** (PC-04) | Complete the adaptive primitives layer; standalone, fast to port |
| 4 | **DashboardSidebar** (PC-06) | Core shell piece; requires NavItem prop externalization — plan 1 sprint |
| 5 | **DashboardLayout** (PC-05) | Composes PC-03 + PC-06; validates the full shell stack |
| 6 | **QuickActionCard** (PC-07) + **ActivityFeed/Item** (PC-08) | Dashboard body blocks; standalone, fast after shell is in |
| 7 | **ModuleCard** (PC-11) + **AgentComposerDesktop/Mobile** (PC-09/10) | Signature responsive-pair pattern; requires type generalization sprint |

---

## 7. Dependency Summary for Port

| Dep | Used by | Already in mosaic-blocks? | Action |
|---|---|---|---|
| `framer-motion` | DashboardSidebar, DashboardLayout, QuickActions, RecentActivity | Not listed as peer | Add as optional peer dep; gate behind `?` or replace with CSS transitions for portability |
| `@radix-ui/react-dialog` | AdaptiveModal | Yes (via shadcn compat layer) | Keep |
| `@radix-ui/react-drawer` (Vaul) | AdaptiveModal | Check — likely no | Add peer dep or swap to `@base-ui/react` Dialog/Popover |
| `@radix-ui/react-tabs` | AdaptiveNavigation | Yes | Keep |
| `@radix-ui/react-scroll-area` | DashboardSidebar | Likely yes | Keep |
| `@radix-ui/react-avatar` | ActivityFeed | Yes | Keep |
| `lucide-react` | All components | Yes | Keep |
| `next/link` / `next/navigation` | DashboardSidebar, QuickActions, RecentActivity | Peer dep (Next.js) | Keep as Next.js peer; provide `renderLink` prop escape hatch for non-Next consumers |
| `lib/monitoring/analytics` (debugResponsive) | DeviceProvider hooks | No — internal | Strip on port (dev-only console logger) |

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-27*
