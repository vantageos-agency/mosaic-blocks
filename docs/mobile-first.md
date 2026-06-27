# Mobile-First Guide — `@vantageos/mosaic-blocks`

All mosaic-blocks components are built mobile-first. This document covers the device system, adaptive primitives, the responsive-pair pattern, and the rules every consumer must follow.

---

## 1. Tailwind v4 Breakpoints

mosaic-blocks uses Tailwind v4 defaults. All breakpoints are **min-width** (mobile-first — base styles apply to mobile, prefixed styles override at wider viewports).

| Prefix | Min-width | Target |
|--------|-----------|--------|
| _(none)_ | 0px | Mobile (< 640px) |
| `sm:` | 640px | Small devices / large phones |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

**Internal breakpoint constants** (used by `MosaicDeviceProvider`):

```ts
// src/components/device-provider/MosaicDeviceProvider.tsx
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };
```

---

## 2. MosaicDeviceProvider + useDevice()

`MosaicDeviceProvider` is the foundation of the entire adaptive system. Every adaptive component (`MosaicAdaptiveGrid`, `MosaicAdaptiveModal`, `MosaicAdaptiveNavigation`, `MosaicAgentComposer`, etc.) **requires** this provider in its ancestor tree.

### Setup

Wrap your app (or sub-tree) once, as high as possible:

```tsx
import { MosaicDeviceProvider } from "@vantageos/mosaic-blocks";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MosaicDeviceProvider>
          {children}
        </MosaicDeviceProvider>
      </body>
    </html>
  );
}
```

### DeviceContextValue — full API

```ts
interface DeviceContextValue {
  // Semantic device type
  isMobile: boolean;    // viewport < md (768px)
  isTablet: boolean;    // md <= viewport < lg
  isDesktop: boolean;   // viewport >= lg

  // Raw breakpoint flags (min-width)
  isSmUp: boolean;      // >= 640px
  isMdUp: boolean;      // >= 768px
  isLgUp: boolean;      // >= 1024px
  isXlUp: boolean;      // >= 1280px

  // Orientation
  orientation: "portrait" | "landscape";

  // Viewport dimensions (debounced)
  viewport: { width: number; height: number };

  // Utility: check a specific breakpoint
  isBreakpoint: (bp: "sm" | "md" | "lg" | "xl") => boolean;
}
```

### useDevice() — consumption

```tsx
"use client";
import { useDevice } from "@vantageos/mosaic-blocks";

function MyComponent() {
  const { isMobile, isTablet, isDesktop, orientation, viewport, isBreakpoint } = useDevice();

  return (
    <div>
      {isMobile && <p>Mobile layout</p>}
      {isTablet && <p>Tablet layout</p>}
      {isDesktop && <p>Desktop layout</p>}
      <p>Orientation: {orientation}</p>
      <p>Viewport: {viewport.width}×{viewport.height}</p>
      <p>Is lg+: {isBreakpoint("lg") ? "yes" : "no"}</p>
    </div>
  );
}
```

### Convenience hooks (standalone)

These can be used independently without `MosaicDeviceProvider`:

```tsx
import {
  useBreakpoint,   // (bp: "sm" | "md" | "lg" | "xl") => boolean
  useIsMobile,     // () => boolean — true when < md
  useIsTablet,     // () => boolean — true when md <= x < lg
  useIsDesktop,    // () => boolean — true when >= lg
  useViewport,     // () => { width: number; height: number }
  useOrientation,  // () => "portrait" | "landscape"
} from "@vantageos/mosaic-blocks";
```

All hooks are **SSR-safe**: they initialise to `false` / `0` on the server and hydrate on the client via `matchMedia` event listeners.

Storybook: `Providers/MosaicDeviceProvider`

---

## 3. Adaptive Primitives

### 3.1 MosaicAdaptiveGrid

Device-aware CSS grid that switches column count based on the current breakpoint.

```tsx
import { MosaicDeviceProvider, MosaicAdaptiveGrid } from "@vantageos/mosaic-blocks";

<MosaicDeviceProvider>
  <MosaicAdaptiveGrid
    mobileColumns={1}   // default: 1
    tabletColumns={2}   // default: 2
    desktopColumns={3}  // default: 3
    gap="gap-6"         // any Tailwind gap class, default "gap-4"
    className="my-section"
  >
    <Card />
    <Card />
    <Card />
  </MosaicAdaptiveGrid>
</MosaicDeviceProvider>
```

Props: `mobileColumns?`, `tabletColumns?`, `desktopColumns?`, `gap?`, `className?`, `ref?`. All optional.

Storybook: `Layout/MosaicAdaptiveGrid`

### 3.2 MosaicAdaptiveModal

Renders a **centered dialog** on desktop and a **bottom-sheet drawer** on mobile. Single unified API — device detection is internal. No external dialog library required (uses native `<dialog>` element for a11y).

```tsx
import { MosaicAdaptiveModal } from "@vantageos/mosaic-blocks";

function Example() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <MosaicAdaptiveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Settings"
        description="Adjust your preferences"  // optional — a11y
      >
        <p>Modal content here</p>
      </MosaicAdaptiveModal>
    </>
  );
}
```

Props: `isOpen`, `onClose`, `title`, `children`, `description?`, `className?`.

Animations: `opacity` + `transform` only (no layout property animations). Respects `prefers-reduced-motion`. Storybook: `Layout/MosaicAdaptiveModal`

### 3.3 MosaicAdaptiveNavigation

Renders **Tabs** on desktop and a collapsible **accordion** on mobile. Accepts a step/section list with optional completion state.

```tsx
import { MosaicAdaptiveNavigation, type MosaicNavigationItem } from "@vantageos/mosaic-blocks";

const steps: MosaicNavigationItem[] = [
  { id: "intro", title: "Introduction", isComplete: true },
  { id: "config", title: "Configuration", duration: 120 },
  { id: "review", title: "Review", children: <ReviewPanel /> },
];

function Example() {
  const [active, setActive] = React.useState("intro");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <MosaicAdaptiveNavigation
      items={steps}
      activeItem={active}
      onItemChange={setActive}
      expandedItems={expanded}       // optional — controls accordion open state
      onToggleExpanded={toggle}      // optional
    />
  );
}
```

Props: `items`, `activeItem`, `onItemChange`, `expandedItems?`, `onToggleExpanded?`, `className?`, `ref?`.

Storybook: `Layout/MosaicAdaptiveNavigation`

---

## 4. Responsive-Pair Pattern

The responsive-pair pattern is the standard for all composed shell blocks. An **orchestrator** component reads `useDevice()` and delegates to either a `Desktop` or `Mobile` variant — the caller never needs to know which renders.

```
MosaicAgentComposer (orchestrator)
  ├── reads useDevice() → isMobile
  ├── isMobile === true  → <MosaicAgentComposerMobile {...props} />
  └── isMobile === false → <MosaicAgentComposerDesktop {...props} />
```

### When to use the orchestrator vs explicit variants

| Use case | Component |
|----------|-----------|
| Standard usage — let the library handle layout | `MosaicAgentComposer` (orchestrator) |
| You need explicit mobile layout always (e.g. in a mobile-only view) | `MosaicAgentComposerMobile` |
| You need explicit desktop layout always (e.g. in an admin panel) | `MosaicAgentComposerDesktop` |
| Testing a specific variant in Storybook | Either explicit variant |

All three are exported from `@vantageos/mosaic-blocks`.

### Blocks using the responsive-pair pattern

| Orchestrator | Desktop export | Mobile export |
|---|---|---|
| `MosaicAgentComposer` | `MosaicAgentComposerDesktop` | `MosaicAgentComposerMobile` |
| `MosaicMessageList` | `MosaicMessageListDesktop` | `MosaicMessageListMobile` |
| `MosaicAgentList` | `MosaicAgentListDesktop` | `MosaicAgentListMobile` |
| `MosaicMarketplaceList` | `MosaicMarketplaceListDesktop` | `MosaicMarketplaceListMobile` |

Desktop and Mobile variants share an identical `*Props` interface. Mobile variants may extend the shared interface with additional props (e.g. `isLoading?: boolean` on `MosaicAgentComposerMobile`).

See `docs/anydebate-components-map.md` §4 for the cartographic origin of this pattern.

### Example: use the orchestrator

```tsx
import {
  MosaicDeviceProvider,
  MosaicAgentComposer,
  type MosaicAgentComposerProps,
} from "@vantageos/mosaic-blocks";

const composerProps: MosaicAgentComposerProps = {
  name: "",
  customInstructions: "",
  selectedRole: null,
  selectedPersona: null,
  selectedFramework: null,
  selectedModel: null,
  onNameChange: (v) => setState(s => ({ ...s, name: v })),
  onRoleSelect: () => setRoleModalOpen(true),
  onPersonaSelect: () => setPersonaModalOpen(true),
  onFrameworkSelect: () => setFrameworkModalOpen(true),
  onModelSelect: () => setModelModalOpen(true),
  onRoleClear: () => setState(s => ({ ...s, selectedRole: null })),
  onPersonaClear: () => setState(s => ({ ...s, selectedPersona: null })),
  onFrameworkClear: () => setState(s => ({ ...s, selectedFramework: null })),
  onModelClear: () => setState(s => ({ ...s, selectedModel: null })),
  onCustomInstructionsChange: (v) => setState(s => ({ ...s, customInstructions: v })),
  canSave: Boolean(name && selectedRole),
  onSave: handleSave,
  onCancel: handleCancel,
  isEditMode: false,
};

export function AgentBuilderPage() {
  return (
    <MosaicDeviceProvider>
      <MosaicAgentComposer {...composerProps} />
    </MosaicDeviceProvider>
  );
}
```

---

## 5. DOs and DON'Ts

### DO

- Wrap the app root (or a sufficiently high ancestor) with `<MosaicDeviceProvider>` once.
- Use `isMobile` / `isTablet` / `isDesktop` for semantic branching; use `isBreakpoint()` for precise px-level checks.
- Set touch targets to a minimum of **44×44px** (WCAG 2.5.5). `MosaicQuickActionCard` and `MosaicAdaptiveNavigation` enforce this internally.
- Include the viewport meta tag in your HTML `<head>`:

  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ```

- Test all components at 375px, 430px (modern large phones), 768px (tablet), 1024px (desktop) viewport widths.
- Use `MosaicAdaptiveModal` instead of separate dialog/drawer components — it handles both automatically.
- Gate client-only device code with `"use client"` — all device hooks use `window.matchMedia` which is not available server-side.

### DON'T

- DON'T hard-code pixel breakpoints in consuming app code — use the `useDevice()` hook instead.
- DON'T assume `isMobile === !isDesktop`. There is an intermediate `isTablet` state (`md <= x < lg`).
- DON'T call `useDevice()` outside a `MosaicDeviceProvider` — it will return default values (`false`, `0×0`, `"portrait"`) without error, which silently breaks adaptive layout.
- DON'T add `"use client"` to Server Components to use device hooks — push device-dependent rendering to a dedicated client component leaf instead.
- DON'T use CSS `@media` queries that conflict with the Tailwind breakpoints above — this creates inconsistency between CSS and JS device state.
- DON'T animate `width`, `height`, `padding`, or `margin` — animate `transform` and `opacity` only (all mosaic-blocks internal animations follow this rule).
- DON'T omit `prefers-reduced-motion` handling in custom motion code — `MosaicAdaptiveModal` handles it with CSS `@media (prefers-reduced-motion: reduce)`.

---

## Reference

- Cartography: `docs/anydebate-components-map.md` §4 — responsive-pair pattern origin.
- Component catalog: `docs/components-catalog.md` — full list of adaptive components with import paths.
- Auth setup: `docs/auth.md` — multi-tenant provider wrapping order.
- Storybook: run `pnpm storybook` to browse all adaptive component stories interactively.
