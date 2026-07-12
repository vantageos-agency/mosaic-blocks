# Components Catalog — `@vantageos/mosaic-blocks`

**All imports:** `import { ComponentName } from "@vantageos/mosaic-blocks"`

Documented: **82 Mosaic* components + 10 hooks** — a curated subset with usage
snippets and prop notes, not the full public API. `src/index.ts` exports
**124** `Mosaic*` components and **141** total named exports; see `README.md`
Section 6 for the complete, machine-checked list of every export.

For mobile-first conventions and the responsive-pair pattern see `docs/mobile-first.md`.
For auth and multi-tenant components see `docs/auth.md`.

---

## Quick-start snippets for flagship components

### MosaicDashboardLayout

Full app shell with sidebar, header, breadcrumbs, and mobile drawer.

```tsx
import {
  MosaicDashboardLayout,
  MosaicDeviceProvider,
} from "@vantageos/mosaic-blocks";
import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MosaicDeviceProvider>
      <MosaicDashboardLayout
        title="Dashboard"
        subtitle="Welcome back"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Agents" }]}
        actions={<ThemeToggle />}
        sidebarProps={{
          navItems: [
            { id: "agents", label: "Agents", href: "/agents", icon: <AgentIcon /> },
            { id: "settings", label: "Settings", href: "/settings", icon: <SettingsIcon /> },
          ],
          quickActions: [{ id: "new", label: "New Agent", icon: <PlusIcon />, onClick: openModal }],
        }}
        renderLink={(href, children) => <Link href={href}>{children}</Link>}
      >
        {children}
      </MosaicDashboardLayout>
    </MosaicDeviceProvider>
  );
}
```

### MosaicAdaptiveModal

Dialog on desktop, bottom-sheet on mobile — one API.

```tsx
import { MosaicAdaptiveModal } from "@vantageos/mosaic-blocks";

<MosaicAdaptiveModal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Confirm action"
  description="This cannot be undone."
>
  <p>Are you sure?</p>
  <button type="button" onClick={handleConfirm}>Confirm</button>
</MosaicAdaptiveModal>
```

### MosaicAgentComposer

Responsive-pair orchestrator for role+persona+framework+model assembly.

```tsx
import { MosaicDeviceProvider, MosaicAgentComposer } from "@vantageos/mosaic-blocks";

<MosaicDeviceProvider>
  <MosaicAgentComposer
    name={name}
    customInstructions={instructions}
    selectedRole={role}
    selectedPersona={persona}
    selectedFramework={framework}
    selectedModel={model}
    onNameChange={setName}
    onRoleSelect={() => setRoleModalOpen(true)}
    onPersonaSelect={() => setPersonaModalOpen(true)}
    onFrameworkSelect={() => setFrameworkModalOpen(true)}
    onModelSelect={() => setModelModalOpen(true)}
    onRoleClear={() => setRole(null)}
    onPersonaClear={() => setPersona(null)}
    onFrameworkClear={() => setFramework(null)}
    onModelClear={() => setModel(null)}
    onCustomInstructionsChange={setInstructions}
    canSave={Boolean(name && role)}
    onSave={handleSave}
    onCancel={handleCancel}
    isEditMode={false}
  />
</MosaicDeviceProvider>
```

### MosaicMultiTenantProvider

Clerk + cloud-identity workspace scope — wrap the entire app.

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { MosaicMultiTenantProvider } from "@vantageos/mosaic-blocks";
import { resolveWorkspaceId } from "@vantageos/cloud-identity";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MosaicMultiTenantProvider
      clerkProvider={ClerkProvider}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      resolveWorkspaceId={resolveWorkspaceId}
    >
      {children}
    </MosaicMultiTenantProvider>
  );
}
```

### MosaicQuickActionCard

Action grid with 7 accent presets and custom link renderer.

```tsx
import { MosaicQuickActionCard, type MosaicQuickAction } from "@vantageos/mosaic-blocks";
import Link from "next/link";

const actions: MosaicQuickAction[] = [
  { id: "new-session", title: "New Session", description: "Start a debate", icon: <PlusIcon />, href: "/sessions/new", accent: "blue" },
  { id: "explore", title: "Explore", description: "Browse templates", icon: <SearchIcon />, href: "/templates", accent: "green" },
  { id: "invite", title: "Invite Team", description: "Add collaborators", icon: <UserPlusIcon />, href: "/team/invite", accent: "purple" },
];

<MosaicQuickActionCard
  actions={actions}
  heading="Quick Actions"
  columns={{ mobile: 1, desktop: 3 }}
  renderLink={(href, children) => <Link href={href}>{children}</Link>}
/>
```

---

## Foundation

### Device system

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicDeviceProvider` | `@vantageos/mosaic-blocks` | Context provider exposing breakpoint flags, orientation, viewport — required ancestor for all adaptive components | — | No | — |
| `useDevice` | `@vantageos/mosaic-blocks` | Returns full `DeviceContextValue` (isMobile, isTablet, isDesktop, isSmUp…isXlUp, orientation, viewport, isBreakpoint) | — | No | `MosaicDeviceProvider` |
| `useBreakpoint` | `@vantageos/mosaic-blocks` | `(bp: "sm"|"md"|"lg"|"xl") => boolean` — SSR-safe matchMedia hook | — | No | — |
| `useIsMobile` | `@vantageos/mosaic-blocks` | Returns true when viewport < md (768px) | — | No | — |
| `useIsTablet` | `@vantageos/mosaic-blocks` | Returns true when md ≤ viewport < lg | — | No | — |
| `useIsDesktop` | `@vantageos/mosaic-blocks` | Returns true when viewport ≥ lg (1024px) | — | No | — |
| `useViewport` | `@vantageos/mosaic-blocks` | Returns `{ width, height }` — debounced resize listener, SSR-safe | — | No | — |
| `useOrientation` | `@vantageos/mosaic-blocks` | Returns `"portrait" \| "landscape"` via orientationchange + resize | — | No | — |

Storybook: `Providers/MosaicDeviceProvider`

### Adaptive primitives

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicAdaptiveGrid` | `@vantageos/mosaic-blocks` | Device-aware CSS grid; switches column count (mobileColumns/tabletColumns/desktopColumns) via inline CSS variables | — (is the primitive) | No | `MosaicDeviceProvider` |
| `MosaicAdaptiveModal` | `@vantageos/mosaic-blocks` | Centered dialog on desktop, bottom-sheet drawer on mobile; native `<dialog>` element, no Radix dep | — (is the primitive) | No | `MosaicDeviceProvider` |
| `MosaicAdaptiveNavigation` | `@vantageos/mosaic-blocks` | Tabs strip on desktop, collapsible accordion on mobile; supports step completion state | — (is the primitive) | No | `MosaicDeviceProvider` |

Storybook: `Layout/MosaicAdaptiveGrid`, `Layout/MosaicAdaptiveModal`, `Layout/MosaicAdaptiveNavigation`

### Dashboard shell

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicDashboardLayout` | `@vantageos/mosaic-blocks` | Full app shell: sticky header with breadcrumbs + actions slot, collapsible sidebar (desktop), mobile sidebar via drawer | Yes (internal) | No | `MosaicDeviceProvider`, `MosaicAppSidebar`, `MosaicAdaptiveModal` |
| `MosaicAppSidebar` | `@vantageos/mosaic-blocks` | Animated collapsible sidebar with nav items, quick actions, recent items, footer status; full-width on mobile | Yes (internal) | No | `MosaicDeviceProvider` |
| `MosaicDashboardHeader` | `@vantageos/mosaic-blocks` | Sticky top header with title, subtitle, breadcrumbs, and right-slot for actions | No | No | — |
| `MosaicDashboardContent` | `@vantageos/mosaic-blocks` | Dashboard content area with view-switcher (grid/list) | No | No | — |

Storybook: `Layout/MosaicDashboardLayout`, `Layout/MosaicAppSidebar`, `Components/MosaicDashboardHeader`, `Components/MosaicDashboardContent`

### Agent composer

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicAgentComposer` | `@vantageos/mosaic-blocks` | Responsive-pair orchestrator — delegates to Desktop or Mobile variant based on `useDevice()` | Yes (orchestrator) | No | `MosaicDeviceProvider` |
| `MosaicAgentComposerDesktop` | `@vantageos/mosaic-blocks` | Two-column composer: form (name, role, persona, framework, model) + live preview panel | No (desktop explicit) | No | — |
| `MosaicAgentComposerMobile` | `@vantageos/mosaic-blocks` | Single-column composer with sticky header and bottom CTA bar; adds `isLoading?` prop | Yes (mobile explicit) | No | — |
| `MosaicModuleCard` | `@vantageos/mosaic-blocks` | Filled-state card for a selected module (name, description, tags, type badge, edit button) | No | No | — |

Storybook: `Components/MosaicAgentComposer`, `Components/MosaicModuleCard`

---

## Organization

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicOrgPanel` | `@vantageos/mosaic-blocks` | Multi-tenant org management shell with tabs (overview, members, settings) | Yes (internal) | No | — |
| `MosaicOrgRoleBadge` | `@vantageos/mosaic-blocks` | Role badge pill (owner/admin/member) with semantic color | No | No | — |
| `MosaicMultiOrgIndicator` | `@vantageos/mosaic-blocks` | Visual indicator for users belonging to multiple orgs | No | No | — |
| `MosaicCreateOrgDialog` | `@vantageos/mosaic-blocks` | Dialog for creating a new organization | No | No | — |
| `MosaicInviteMemberDialog` | `@vantageos/mosaic-blocks` | Dialog for inviting a new team member by email + role | No | No | — |
| `MosaicMemberList` | `@vantageos/mosaic-blocks` | Responsive list of org members with avatars, roles, and actions | Yes (internal) | No | — |
| `MosaicOrgSwitcher` | `@vantageos/mosaic-blocks` | **Presentational** org picker dropdown; receives orgs via props — distinct from `MosaicClerkOrgSwitcher` | No | No | — |

Storybook: `Components/MosaicOrgPanel`, `Components/MosaicOrgSwitcher`

---

## Templates

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicTemplateGallery` | `@vantageos/mosaic-blocks` | Full template browser with search, filter, and preview; responsive-pair | Yes (internal) | No | `MosaicDeviceProvider` |
| `MosaicTemplateCard` | `@vantageos/mosaic-blocks` | Template summary card with title, description, tags, and CTA | No | No | — |
| `MosaicTemplatePreview` | `@vantageos/mosaic-blocks` | Full-detail template preview panel | No | No | — |
| `MosaicQuickStartPanel` | `@vantageos/mosaic-blocks` | Compact quick-start flow panel for launching from a template | No | No | — |
| `MosaicAgentTeamPreview` | `@vantageos/mosaic-blocks` | Visual preview of the agent team defined in a template | No | No | — |

Storybook: `Components/MosaicTemplateGallery`

---

## Marketplace

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicMarketplaceList` | `@vantageos/mosaic-blocks` | Responsive-pair marketplace grid; Desktop = card grid, Mobile = list | Yes (orchestrator) | No | `MosaicDeviceProvider` |
| `MosaicMarketplaceListDesktop` | `@vantageos/mosaic-blocks` | Desktop card-grid layout for marketplace items | No (desktop explicit) | No | — |
| `MosaicMarketplaceListMobile` | `@vantageos/mosaic-blocks` | Mobile list layout for marketplace items | Yes (mobile explicit) | No | — |

Storybook: `Components/MosaicMarketplaceList`

---

## Messages

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicMessageCard` | `@vantageos/mosaic-blocks` | Single message/chat card with sender info, reactions, timestamp | No | No | — |
| `MosaicMessageList` | `@vantageos/mosaic-blocks` | Responsive-pair message list; Desktop = panel, Mobile = full-screen | Yes (orchestrator) | No | `MosaicDeviceProvider` |
| `MosaicMessageListDesktop` | `@vantageos/mosaic-blocks` | Desktop two-panel message list layout | No (desktop explicit) | No | — |
| `MosaicMessageListMobile` | `@vantageos/mosaic-blocks` | Mobile full-screen message list | Yes (mobile explicit) | No | — |

Storybook: `Components/MosaicMessageCard`, `Components/MosaicMessageList`

---

## Settings

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicPreferencesPanel` | `@vantageos/mosaic-blocks` | Generic user preferences form; groups + individual preference fields with labels and controls | No | No | — |
| `MosaicProfilePanel` | `@vantageos/mosaic-blocks` | Generic user profile form with editable fields, avatar slot, and save action | No | No | — |

Storybook: `Components/MosaicPreferencesPanel`, `Components/MosaicProfilePanel`

---

## Module libraries

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicModuleLibrary` | `@vantageos/mosaic-blocks` | Generic module/library manager with search, filter, and CRUD; responsive-pair | Yes (internal) | No | `MosaicDeviceProvider` |
| `MosaicModuleForm` | `@vantageos/mosaic-blocks` | Generic create/edit form for a module item | No | No | — |

Storybook: `Components/MosaicModuleLibrary`

---

## Agent config

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicSelectorModal` | `@vantageos/mosaic-blocks` | Generic searchable item-picker modal with category tabs; used for role/persona/framework selection | No | No | — |

Storybook: `Components/MosaicSelectorModal`

---

## Agent management

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicAgentCard` | `@vantageos/mosaic-blocks` | Generic agent/resource card with avatar, title, description, status badge, and action menu | No | No | — |
| `MosaicQuickAgentSelector` | `@vantageos/mosaic-blocks` | Compact agent pill picker; select from a list of agents inline | No | No | — |
| `MosaicAgentList` | `@vantageos/mosaic-blocks` | Responsive-pair agent list; Desktop = data table, Mobile = card list | Yes (orchestrator) | No | `MosaicDeviceProvider` |
| `MosaicAgentListDesktop` | `@vantageos/mosaic-blocks` | Desktop table/grid layout for agent list | No (desktop explicit) | No | — |
| `MosaicAgentListMobile` | `@vantageos/mosaic-blocks` | Mobile card-list layout for agent list | Yes (mobile explicit) | No | — |
| `MosaicFilterSidebar` | `@vantageos/mosaic-blocks` | Collapsible filter sidebar with category groups and option checkboxes | No | No | — |
| `MosaicActivityFeed` | `@vantageos/mosaic-blocks` | Feed of activity items with stagger animation; accepts `activities[]` and `viewAllHref` | No | No | — |
| `MosaicActivityItem` | `@vantageos/mosaic-blocks` | Single activity row: icon, title, description, participant avatars, message count, status badge | No | No | `MosaicActivityFeed` |
| `MosaicQuickActionCard` | `@vantageos/mosaic-blocks` | Action grid with 7 accent presets (yellow/blue/green/purple/orange/cyan/gray); `renderLink` escape hatch | No | No | — |
| `MosaicQuickActionsMenu` | `@vantageos/mosaic-blocks` | Dropdown button with a list of quick-action items | No | No | — |

Storybook: `Components/MosaicAgentCard`, `Components/MosaicQuickAgentSelector`, `Components/MosaicAgentList`, `Components/MosaicFilterSidebar`, `Components/MosaicActivityFeed`, `Components/MosaicQuickActionCard`, `Components/MosaicQuickActionsMenu`

---

## Layout

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicMainNav` | `@vantageos/mosaic-blocks` | Generic responsive top navigation bar; Desktop = inline links, Mobile = drawer | Yes (internal) | No | `MosaicDeviceProvider` |

Storybook: `Components/MosaicMainNav`

---

## Shared utilities

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicDeleteConfirmationDialog` | `@vantageos/mosaic-blocks` | Generic destructive-action confirm dialog with cancel/confirm buttons and item name display | No | No | — |

Storybook: `Components/MosaicDeleteConfirmationDialog`

---

## Theme provider

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicThemeProvider` | `@vantageos/mosaic-blocks` | next-themes wrapper with OKLCH design token support; handles light/dark/system | No | No | `next-themes` |

Storybook: `Providers/MosaicThemeProvider`

---

## Auth components (Clerk-backed)

Full documentation in `docs/auth.md`.

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicSignInLayout` | `@vantageos/mosaic-blocks` | Sign-in page layout with OKLCH-themed Clerk SignIn widget; Clerk injected as prop | Yes (mobile-first) | Yes | `@clerk/nextjs` peer |
| `MosaicSignUpLayout` | `@vantageos/mosaic-blocks` | Sign-up page layout with OKLCH-themed Clerk SignUp widget; Clerk injected as prop | Yes (mobile-first) | Yes | `@clerk/nextjs` peer |
| `MosaicClerkOrgSwitcher` | `@vantageos/mosaic-blocks` | **Clerk-backed** org switcher (live org data from Clerk); inject `clerkOrgSwitcher` prop — distinct from `MosaicOrgSwitcher` (presentational) | No | Yes | `@clerk/nextjs` peer |
| `MosaicUserButton` | `@vantageos/mosaic-blocks` | Clerk UserButton with OKLCH appearance; inject `clerkUserButton` prop | No | Yes | `@clerk/nextjs` peer |
| `MosaicOrgProfilePage` | `@vantageos/mosaic-blocks` | Clerk OrganizationProfile for team management; inject `clerkOrgProfile` prop | No | Yes | `@clerk/nextjs` peer |

---

## Multi-tenant (Clerk + cloud-identity)

Full documentation in `docs/auth.md`.

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicMultiTenantProvider` | `@vantageos/mosaic-blocks` | ClerkProvider wrapper + `@vantageos/cloud-identity` workspace-scope context; resolves workspace ID per org | No | Yes | `@clerk/nextjs` peer, `@vantageos/cloud-identity` peer |
| `useMosaicWorkspace` | `@vantageos/mosaic-blocks` | Returns `{ workspaceId: string \| null, isLoading: boolean }` from the nearest provider | — | Yes | `MosaicMultiTenantProvider` |
| `useEffectiveWorkspaceId` | `@vantageos/mosaic-blocks` | Re-export alias of `useMosaicWorkspace` for cloud-identity consumers | — | Yes | `MosaicMultiTenantProvider` |
| `MosaicClerkWebhookHandler` | `@vantageos/mosaic-blocks` | Async function for Next.js App Router API routes — verifies Clerk webhook via svix, routes `organization.created` / `organizationMembership.created` / `organizationMembership.deleted` | — | Yes | `svix` (install separately) |

---

## Landing / marketing blocks (T3-A)

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicNavbar` | `@vantageos/mosaic-blocks` | Marketing navbar with logo, links, and CTA button | No | No | — |
| `MosaicHeroSplit` | `@vantageos/mosaic-blocks` | Split hero with headline, description, CTA buttons, and media slot | No | No | — |
| `MosaicFeatureCenteredMedia` | `@vantageos/mosaic-blocks` | Centered feature section with media and feature list | No | No | — |
| `MosaicFeature3Col` | `@vantageos/mosaic-blocks` | Three-column feature grid with icon, title, description per column | No | No | — |
| `MosaicStatsGrid` | `@vantageos/mosaic-blocks` | Responsive stats grid of metric + label pairs | No | No | — |
| `MosaicPricingCard` | `@vantageos/mosaic-blocks` | Pricing tier card with feature list, price, and CTA | No | No | — |
| `MosaicLogosGrid` | `@vantageos/mosaic-blocks` | Logo cloud grid for social proof | No | No | — |
| `MosaicTestimonialsGrid` | `@vantageos/mosaic-blocks` | Testimonials masonry/grid with avatar, quote, attribution | No | No | — |
| `MosaicFooterSimple` | `@vantageos/mosaic-blocks` | Simple footer with columns, links, and social icons | No | No | — |

---

## Utility blocks (T3-B)

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicCounter` | `@vantageos/mosaic-blocks` | Animated counter that increments from 0 to target value on mount | No | No | — |
| `MosaicThemeToggle` | `@vantageos/mosaic-blocks` | Light/dark/system theme switcher button | No | No | `MosaicThemeProvider` |
| `MosaicBlurredOrb` | `@vantageos/mosaic-blocks` | Decorative blurred color orb for backgrounds; 4 position presets | No | No | — |
| `MosaicAnimatedList` | `@vantageos/mosaic-blocks` | Stagger-animated list that reveals items sequentially on mount | No | No | — |
| `MosaicIntegrationsBadge` | `@vantageos/mosaic-blocks` | Animated badge row for displaying integration logos | No | No | — |
| `MosaicFallingPattern` | `@vantageos/mosaic-blocks` | CSS-animated falling icon/pattern background decoration | No | No | — |

---

## Base-UI atoms (T3-C)

| Name | Import path | Description | Mobile variant? | Auth-related? | Depends-on |
|------|-------------|-------------|-----------------|---------------|------------|
| `MosaicButton` | `@vantageos/mosaic-blocks` | Primary button atom with 5 variants and 4 sizes; also exports `buttonVariants` | No | No | — |
| `MosaicCard` | `@vantageos/mosaic-blocks` | Composable card container; also exports `MosaicCardHeader`, `MosaicCardTitle`, `MosaicCardDescription`, `MosaicCardContent`, `MosaicCardFooter` | No | No | — |
| `MosaicBadge` | `@vantageos/mosaic-blocks` | Status/label badge with variant system; also exports `badgeVariants` | No | No | — |
| `MosaicAvatar` | `@vantageos/mosaic-blocks` | Avatar with image + initials fallback via `@base-ui/react` | No | No | `@base-ui/react` |
| `MosaicInput` | `@vantageos/mosaic-blocks` | Accessible text input via `@base-ui/react` | No | No | `@base-ui/react` |
| `MosaicInputGroup` | `@vantageos/mosaic-blocks` | Input with prefix/suffix slot composition | No | No | `MosaicInput` |
| `MosaicField` | `@vantageos/mosaic-blocks` | Form field wrapper; also exports `MosaicFieldLabel`, `MosaicFieldControl`, `MosaicFieldDescription`, `MosaicFieldError` | No | No | `@base-ui/react` |
| `MosaicSwitch` | `@vantageos/mosaic-blocks` | Accessible toggle switch via `@base-ui/react` | No | No | `@base-ui/react` |
| `MosaicSelect` | `@vantageos/mosaic-blocks` | Accessible select dropdown via `@base-ui/react` | No | No | `@base-ui/react` |
| `MosaicCombobox` | `@vantageos/mosaic-blocks` | Searchable combobox with keyboard navigation via `@base-ui/react` | No | No | `@base-ui/react` |
| `MosaicDropdownMenu` | `@vantageos/mosaic-blocks` | Accessible dropdown menu via `@base-ui/react` | No | No | `@base-ui/react` |

---

## Hooks summary

| Name | Import path | Description |
|------|-------------|-------------|
| `useDevice` | `@vantageos/mosaic-blocks` | Full device context (isMobile, isTablet, isDesktop, isSmUp…, orientation, viewport, isBreakpoint) |
| `useBreakpoint` | `@vantageos/mosaic-blocks` | `(bp: Breakpoint) => boolean` — raw matchMedia hook |
| `useIsMobile` | `@vantageos/mosaic-blocks` | `() => boolean` |
| `useIsTablet` | `@vantageos/mosaic-blocks` | `() => boolean` |
| `useIsDesktop` | `@vantageos/mosaic-blocks` | `() => boolean` |
| `useViewport` | `@vantageos/mosaic-blocks` | `() => { width: number; height: number }` |
| `useOrientation` | `@vantageos/mosaic-blocks` | `() => "portrait" \| "landscape"` |
| `useMediaQuery` | `@vantageos/mosaic-blocks` | `(query: string) => boolean` — generic matchMedia hook |
| `useMosaicWorkspace` | `@vantageos/mosaic-blocks` | `() => { workspaceId: string \| null, isLoading: boolean }` |
| `useEffectiveWorkspaceId` | `@vantageos/mosaic-blocks` | Alias of `useMosaicWorkspace` |

---

## Documented / exported ratio

This catalog is a **curated subset**, not the full public API. It documents
**82 `Mosaic*` components** and **10 hooks** out of the **124** `Mosaic*`
components (**141** total named exports) that `src/index.ts` actually
exports. The full 1:1 list lives in `README.md` Section 6, which is guarded
by a CI test against drift.

Count breakdown by section (Mosaic* components only, hooks counted separately
below):
- Foundation (device system + adaptive primitives + dashboard shell + agent composer): 12
- Organization: 7
- Templates: 5
- Marketplace: 3
- Messages: 4
- Settings: 2
- Module libraries: 2
- Agent config: 1
- Agent management: 10
- Layout: 1
- Shared utilities: 1
- Theme provider: 1
- Auth (Clerk-backed): 5
- Multi-tenant: 2
- Landing blocks: 9
- Utility blocks: 6
- Base-UI atoms: 11

Total unique `Mosaic*` components documented in this catalog: **82**

Hooks documented in the "Hooks summary" table: **10**
(`useDevice`, `useBreakpoint`, `useIsMobile`, `useIsTablet`, `useIsDesktop`,
`useViewport`, `useOrientation`, `useMediaQuery`, `useMosaicWorkspace`,
`useEffectiveWorkspaceId`)
