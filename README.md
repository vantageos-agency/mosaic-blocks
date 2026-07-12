# @vantageos/mosaic-blocks

[![npm version](https://img.shields.io/npm/v/@vantageos/mosaic-blocks)](https://www.npmjs.com/package/@vantageos/mosaic-blocks)
[![CI](https://github.com/vantageos-agency/mosaic-blocks/actions/workflows/ci.yml/badge.svg)](https://github.com/vantageos-agency/mosaic-blocks/actions/workflows/ci.yml)
[![License: FSL-1.1-Apache-2.0](https://img.shields.io/badge/license-FSL--1.1--Apache--2.0-blue)](LICENSE)

**Production-ready composed UI blocks for VantageOS products.** Built on React 19 + Tailwind v4 + `@base-ui/react`. Ships mobile-first, multi-tenant auth, OKLCH theming, and full bilingual (FR+EN) out of the box.

---

## 1. Hero & Positioning

`@vantageos/mosaic-blocks` is the **React composed-block layer** of the VantageOS Mosaic design system. It provides 131 opinionated, fully-typed UI components that integrate natively with:

- **Clerk** — auth sign-in/up flows, org switcher, RBAC, webhook sync
- **Convex** — real-time data binding ready
- **Tailwind v4** — OKLCH semantic color tokens, dark mode, mobile-first breakpoints
- **Next.js 15+** — App Router, Server Components compatible

This is not a headless utility library. Components are composed, styled, and production-tested. Import and use — no assembly required.

> Absorbed from **anydebate** (production SaaS) — these blocks ran in a live multi-tenant debate platform before extraction. See [Section 17 — Credits](#17-credits).

---

## 2. Why This Package (vs shadcn raw / MUI / headless)

| | mosaic-blocks | shadcn raw | MUI | headless-ui |
|---|---|---|---|---|
| Composed blocks (Dashboard, OrgPanel, AgentComposer) | Yes | No | Partial | No |
| OKLCH dark mode out of the box | Yes | Manual | No | No |
| Clerk multi-tenant auth wired in | Yes | DIY | DIY | DIY |
| Mobile-first adaptive system (DeviceProvider) | Yes | No | No | No |
| FR+EN bilingual locale | Yes | No | No | No |
| React 19 / Tailwind v4 native | Yes | Partial | No | Partial |
| Zero config (CSS tokens auto-injected) | Yes | No | No | No |

shadcn/ui is the underlying primitive layer — mosaic-blocks sits on top and composes it with auth, layout, and multi-tenant concerns so you do not have to.

---

## 3. Install

```bash
pnpm add @vantageos/mosaic-blocks
```

### Peer dependencies (required)

| Package | Min version | Required when |
|---|---|---|
| `react` | `^19.0.0` | Always |
| `react-dom` | `^19.0.0` | Always |
| `tailwindcss` | `^4.3.1` | Always |
| `@base-ui/react` | `^1.5.0` | Auto-installed (direct dep) |
| `@clerk/nextjs` | `^7` | Using any auth component |
| `@vantageos/cloud-identity` | `^0.2` | `MosaicMultiTenantProvider` |
| `svix` | `^1.0.0` | `MosaicClerkWebhookHandler` only |

```bash
# Minimal — no auth
pnpm add @vantageos/mosaic-blocks react react-dom tailwindcss

# Full — with Clerk auth
pnpm add @vantageos/mosaic-blocks react react-dom tailwindcss @clerk/nextjs @vantageos/cloud-identity
```

---

## svix — webhook signature verification

`MosaicClerkWebhookHandler` dynamically imports `svix` at runtime (not at module load) to verify Clerk webhook signatures, and throws an explicit `Error` with installation instructions if it cannot be resolved — it never silently fails.

**Known gap (not fixed by this doc pass):** `svix` is currently declared as a regular `dependencies` entry in `package.json`, not a `peerDependencies`/`optionalDependencies` entry. In practice this means `svix` installs automatically for every consumer of `@vantageos/mosaic-blocks`, whether or not you use `MosaicClerkWebhookHandler` — it is not truly opt-in today. Tracked as a follow-up; do not assume you can skip installing it based on this README alone until the `package.json` classification changes.

```bash
npm install svix
# or
pnpm add svix
```

---

## 4. Quick Start (30 seconds)

```tsx
// app/layout.tsx
import "@vantageos/mosaic-blocks/styles.css";
import { MosaicDeviceProvider } from "@vantageos/mosaic-blocks";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MosaicDeviceProvider>{children}</MosaicDeviceProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/dashboard/page.tsx
import { MosaicDashboardLayout } from "@vantageos/mosaic-blocks";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <MosaicDashboardLayout
      title="My App"
      breadcrumbs={[{ label: "Dashboard" }]}
      sidebarProps={{
        navItems: [{ id: "home", label: "Home", href: "/", icon: null }],
        quickActions: [],
      }}
      renderLink={(href, children) => <Link href={href}>{children}</Link>}
    >
      <p>Hello from mosaic-blocks.</p>
    </MosaicDashboardLayout>
  );
}
```

---

## 5. Configuration

### Tailwind v4 — `@source` directive (REQUIRED)

mosaic-blocks ships compiled JS that references Tailwind utility classes. Your Tailwind build must scan the package's `dist/` or classes will be purged:

```css
/* app/globals.css */
@import "tailwindcss";

/* Scan mosaic-blocks dist for utility classes */
@source "../node_modules/@vantageos/mosaic-blocks/dist";

/* Import OKLCH semantic token variables */
@import "@vantageos/mosaic-blocks/styles.css";
```

### Tailwind v3 — `content` path

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{tsx,ts}",
    "./node_modules/@vantageos/mosaic-blocks/dist/**/*.{js,cjs}",
  ],
};
```

### Provider wrap

Wrap your application root with `MosaicDeviceProvider` for the full adaptive system:

```tsx
import { MosaicDeviceProvider } from "@vantageos/mosaic-blocks";

// Wrap once at app root — all adaptive components require this ancestor
<MosaicDeviceProvider>{children}</MosaicDeviceProvider>
```

For OKLCH design tokens, pair with `@vantageos/mosaic-tokens` — see [Section 10 — Theming](#10-theming).

---

## 6. Component Catalogue Summary

131 exported `Mosaic*` components across 9 sections (153 total named exports including hooks, variant helpers, and unprefixed aliases such as `Tooltip`/`Accordion`). This count is enforced by `src/__tests__/readme-matches-exports.test.ts` — it fails CI if this README drifts from `src/index.ts` again. Full reference: [docs/components-catalog.md](docs/components-catalog.md).

> There is **no "Debate" section**. No `Mosaic*` debate component (room/timer/participant) is exported by this package — despite the "absorbed from anydebate" origin story below, the debate UI was never ported. If you need debate-room UI, it does not exist here yet.

| Section | Top components | Count |
|---|---|---|
| Layout & navigation | `MosaicDashboardLayout`, `MosaicAppSidebar`, `MosaicDashboardHeader` | 9 |
| Device / Adaptive | `MosaicDeviceProvider`, `MosaicAdaptiveGrid`, `MosaicAdaptiveModal`, `MosaicAdaptiveNavigation` | 4 |
| Auth / Multi-tenant | `MosaicMultiTenantProvider`, `MosaicSignInLayout`, `MosaicOrgPanel`, `MosaicClerkWebhookHandler` | 14 |
| Agents & messaging | `MosaicAgentComposer`, `MosaicAgentCard`, `MosaicAgentList`, `MosaicMessageList`, `MosaicMarketplaceList` | 28 |
| Data display | `MosaicDataTable`, `MosaicKanbanBoard`, `MosaicStepPipeline`, `MosaicActivityFeed`, `MosaicDocumentUpload`, `MosaicUrlScraper`, `MosaicMarkdown`, `MosaicApprovalPrompt` | 10 |
| Forms & inputs | `MosaicInput`, `MosaicSelect`, `MosaicField`, `MosaicCombobox`, `MosaicFilterBar` | 17 |
| Primitives (incl. base-ui atoms) | `MosaicButton`, `MosaicBadge`, `MosaicCard`, `MosaicTabs`, `MosaicTooltip`, `MosaicAccordion` | 30 |
| Landing & utility blocks | `MosaicHeroSplit`, `MosaicStatsGrid`, `MosaicPricingCard`, `MosaicCounter`, `MosaicThemeToggle` | 13 |
| Theming | `MosaicThemeProvider` | 1 |

All exports: `import { ComponentName } from "@vantageos/mosaic-blocks"`

---

## 7. Auth Integration

mosaic-blocks includes production-ready Clerk auth components with multi-tenant support. Full guide: [docs/auth.md](docs/auth.md).

```tsx
// app/layout.tsx — 5-line Clerk + multi-tenant setup
import { ClerkProvider } from "@clerk/nextjs";
import { MosaicMultiTenantProvider } from "@vantageos/mosaic-blocks";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <MosaicMultiTenantProvider workspaceId={process.env.WORKSPACE_ID}>
        {children}
      </MosaicMultiTenantProvider>
    </ClerkProvider>
  );
}
```

Key auth components:

- `MosaicSignInLayout` / `MosaicSignUpLayout` — styled Clerk auth flows
- `MosaicOrgSwitcher` — organization switcher with avatar, plan badge
- `MosaicOrgPanel` — full org management (members, roles, invitations)
- `MosaicClerkWebhookHandler` — Next.js route handler for Clerk webhook sync (requires `svix`)
- `useEffectiveWorkspaceId` — hook to read active workspace from context

RBAC is handled through Clerk's `has()` helper — see [docs/auth.md](docs/auth.md) for role guard patterns.

---

## 8. Mobile-First

Every component is built mobile-first. Full guide: [docs/mobile-first.md](docs/mobile-first.md).

### DeviceProvider + adaptive primitives

```tsx
import {
  MosaicDeviceProvider,
  MosaicAdaptiveGrid,
  useDevice,
} from "@vantageos/mosaic-blocks";

function MyPage() {
  const { isMobile } = useDevice();

  return (
    <MosaicDeviceProvider>
      <MosaicAdaptiveGrid
        mobileColumns={1}
        tabletColumns={2}
        desktopColumns={3}
      >
        {items.map((item) => <Card key={item.id} {...item} />)}
      </MosaicAdaptiveGrid>
    </MosaicDeviceProvider>
  );
}
```

Breakpoints follow Tailwind v4 defaults: `sm` 640px / `md` 768px / `lg` 1024px / `xl` 1280px.

Adaptive components: `MosaicAdaptiveGrid`, `MosaicAdaptiveModal`, `MosaicAdaptiveNavigation`, `MosaicAgentComposer`. All require `MosaicDeviceProvider` in their ancestor tree.

---

## 9. i18n

mosaic-blocks ships bilingual (FR+EN) out of the box via `@vantageos/mosaic-i18n`.

```bash
pnpm add @vantageos/mosaic-i18n react-i18next i18next
```

```tsx
import { initMosaicI18n } from "@vantageos/mosaic-i18n";

// Initialize once at app root
initMosaicI18n({ defaultLanguage: "fr" }); // or "en"
```

Override individual strings:

```tsx
import { mergeMosaicTranslations } from "@vantageos/mosaic-i18n";

mergeMosaicTranslations("fr", {
  "mosaic.button.confirm": "Valider",
  "mosaic.agentComposer.launch": "Lancer l'agent",
});
```

Locale files (JSON): `@vantageos/mosaic-i18n/locales/en.json` and `@vantageos/mosaic-i18n/locales/fr.json`.

---

## 10. Theming

mosaic-blocks uses OKLCH semantic CSS variables provided by `@vantageos/mosaic-tokens`.

```bash
pnpm add @vantageos/mosaic-tokens
```

```css
/* app/globals.css */
@import "@vantageos/mosaic-tokens/css"; /* declares --mosaic-color-*, --mosaic-space-*, etc. */
@import "@vantageos/mosaic-blocks/styles.css"; /* maps tokens to Tailwind utility classes */
```

### Dark mode

```css
/* Automatic via Tailwind v4 dark: prefix — tokens handle the rest */
@import "tailwindcss";
@import "@vantageos/mosaic-tokens/css";
@import "@vantageos/mosaic-blocks/styles.css";
```

Components use semantic tokens (`--mosaic-color-neutral-50`, `--mosaic-color-danger-500`, etc.) — swap the token set at `:root` to rebrand entirely. 58 tokens across colors, spacing, typography, shadows, radii, and motion.

---

## 11. TypeScript

mosaic-blocks is written in strict TypeScript. All props are fully typed with no `any`.

```bash
# tsconfig.json requirement
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"   // or "node16"
  }
}
```

Named exports only — tree-shakeable. Types are co-located with each component in `dist/index.d.ts`.

---

## 12. Examples

### Basic — Dashboard layout with sidebar

```tsx
import {
  MosaicDashboardLayout,
  MosaicDeviceProvider,
  MosaicActivityFeed,
} from "@vantageos/mosaic-blocks";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <MosaicDeviceProvider>
      <MosaicDashboardLayout
        title="Analytics"
        breadcrumbs={[{ label: "Dashboard" }]}
        sidebarProps={{
          navItems: [
            { id: "overview", label: "Overview", href: "/", icon: null },
            { id: "agents", label: "Agents", href: "/agents", icon: null },
          ],
          quickActions: [],
        }}
        renderLink={(href, children) => <Link href={href}>{children}</Link>}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MosaicActivityFeed
            activities={[]}
            heading="Recent activity"
            viewAllLabel="View all"
            emptyMessage="No activity yet"
          />
        </div>
      </MosaicDashboardLayout>
    </MosaicDeviceProvider>
  );
}
```

### Mobile-first — Adaptive grid with device detection

```tsx
import {
  MosaicDeviceProvider,
  MosaicAdaptiveGrid,
  useDevice,
} from "@vantageos/mosaic-blocks";

function AgentsList({ agents }: { agents: Agent[] }) {
  const { isMobile, isTablet } = useDevice();

  return (
    <MosaicAdaptiveGrid
      mobileColumns={1}
      tabletColumns={2}
      desktopColumns={3}
      gap={isMobile ? "sm" : "md"}
    >
      {agents.map((agent) => (
        <MosaicAgentCard
          key={agent.id}
          agent={agent}
          compact={isMobile}
        />
      ))}
    </MosaicAdaptiveGrid>
  );
}

export default function AgentsPage({ agents }: { agents: Agent[] }) {
  return (
    <MosaicDeviceProvider>
      <AgentsList agents={agents} />
    </MosaicDeviceProvider>
  );
}
```

### Auth — Multi-tenant sign-in with Clerk

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import {
  MosaicMultiTenantProvider,
  MosaicSignInLayout,
} from "@vantageos/mosaic-blocks";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <MosaicMultiTenantProvider>
        {children}
      </MosaicMultiTenantProvider>
    </ClerkProvider>
  );
}

// app/sign-in/page.tsx
// clerkSignIn is injected by the caller so mosaic-blocks never bundles Clerk directly.
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <MosaicSignInLayout
        clerkSignIn={SignIn}
        path="/sign-in"
        routing="path"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
```

---

## 13. Browser Support

| Browser | Min version |
|---|---|
| Chrome / Edge | 111+ (OKLCH support) |
| Firefox | 113+ |
| Safari | 15.4+ |
| Mobile Safari | iOS 15.4+ |
| Mobile Chrome | Android 111+ |

OKLCH color space requires modern browsers. IE is not supported. For older browser support, provide fallback CSS variables.

---

## 14. Versioning & Changelog

This package follows [Semantic Versioning](https://semver.org/). While in alpha (`0.x.y`), minor versions may contain breaking changes.

| Version | Status | Notes |
|---|---|---|
| `0.5.10-alpha` | Current | 131 exported `Mosaic*` components, adds `MosaicToolToggleList` (per-tool switch + approval-level selector) — superseded row below is the previous Current |
| `0.5.9-alpha` | Historical | 130 shipped `Mosaic*` components — adds `MosaicApprovalPrompt` (tool-call approve/deny) — superseded by the Current row above |
| `0.5.8-alpha` | Historical | 129 shipped `Mosaic*` components — adds `MosaicChatMessage` (chat message: role + text/reasoning/tool-call parts) — superseded by the Current row above |
| `0.5.7-alpha` | Historical | 128 shipped `Mosaic*` components, adds `MosaicChatThread` (presentational auto-scrolling chat thread), `MosaicChatComposer` (chat input + send/stop button), and `MosaicMarkdown` (dependency-free markdown renderer), Clerk auth, mobile-first, Storybook 10, 30 stories — superseded by the Current row above |
| `0.5.6-alpha` | Historical | 127 shipped `Mosaic*` components, adds `MosaicChatThread` (presentational auto-scrolling chat thread) and `MosaicChatComposer` (chat input + send/stop button), Clerk auth, mobile-first, Storybook 10, 30 stories — superseded by the Current row above |
| `0.5.1-alpha` | Historical | 126 shipped `Mosaic*` components, adds `MosaicChatThread` (presentational auto-scrolling chat thread) — superseded by the Current row above |
| `0.4.8-alpha` | Historical | 125 shipped `Mosaic*` components, Clerk auth, mobile-first, Storybook 10, 30 stories — superseded by the Current row above |
| `0.4.7-alpha` | Historical | 124 shipped `Mosaic*` components — superseded by the Current row above |
| `0.2.0-alpha` | Historical | anydebate absorb (partial) — counts quoted for this release are historical and superseded by the Current row above; see [CHANGELOG.md](CHANGELOG.md) |
| `0.1.0-alpha.1` | Historical | Initial alpha publish |

Full release history: [CHANGELOG.md](CHANGELOG.md)

Pre-stable: we will follow `0.x.y-alpha` until API surface stabilizes. Subscribe to GitHub releases for breaking change notices.

---

## 15. Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full workflow.

Quick summary:

1. Fork and clone the repo
2. `pnpm install` at repo root
3. `pnpm build` — compiles the package
4. `pnpm test` — runs vitest suite (557+ tests; exact count grows with every PR, see CI output)
5. `pnpm lint` — biome check
6. `pnpm storybook` — component sandbox at localhost:6006
7. Open a PR — CI gate has 7 required checks (Lint, Typecheck, Test, Parse guard, Build, Sandbox build, React-doctor — see `.github/workflows/ci.yml`)

All PRs require a passing CI and a review. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design and [docs/adr/](docs/adr/) for architecture decisions.

---

## 16. License

`@vantageos/mosaic-blocks` is licensed under the **Functional Source License, Version 1.1, Apache 2.0 Future License** (`FSL-1.1-Apache-2.0`).

- Free for non-production use, research, and evaluation
- Commercial use requires a valid VantageOS license
- Converts to Apache 2.0 after 2 years from each release

Full license: [LICENSE](LICENSE)

---

## 17. Credits

**Origin**: these components were extracted from **anydebate**, a production multi-tenant debate SaaS. The absorb mission (gamma/anydebate-absorb) ported the shell, auth, mobile-first system, and all wave-1 + wave-2 components into this library under FSL.

**Upstream dependencies**:

- [`@base-ui/react`](https://base-ui.com/) — headless primitives foundation (ADR: [docs/adr/0001-base-ui-vs-radix.md](docs/adr/0001-base-ui-vs-radix.md))
- [`@clerk/nextjs`](https://clerk.com/) — authentication and organization management
- [Convex](https://convex.dev/) — real-time backend (binding patterns in [docs/auth.md](docs/auth.md))
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS v4
- [VantageOS](https://vantageos.com/) — parent design system (mosaic-tokens, mosaic-i18n)

**Design system packages**:

- [`@vantageos/mosaic-tokens`](https://www.npmjs.com/package/@vantageos/mosaic-tokens) — OKLCH design tokens (colors, spacing, typography, motion)
- [`@vantageos/mosaic-i18n`](https://www.npmjs.com/package/@vantageos/mosaic-i18n) — FR+EN locale resources

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-27*
