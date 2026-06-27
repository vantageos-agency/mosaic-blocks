# Auth & Multi-Tenant Guide — `@vantageos/mosaic-blocks`

This document covers all authentication and multi-tenant components: installation, quick-start, Clerk integration patterns, RBAC, webhook sync, and migration notes from the `anydebate` upstream.

---

## Installation and peer dependencies

```bash
# Required for all auth components
npm install @vantageos/mosaic-blocks @clerk/nextjs @vantageos/cloud-identity

# Required ONLY when using MosaicClerkWebhookHandler
npm install svix
```

> **IMPORTANT — svix peer dependency**
>
> `MosaicClerkWebhookHandler` uses a runtime dynamic import of `svix` to verify Clerk webhook signatures. `svix` is **not** bundled into `@vantageos/mosaic-blocks` to keep the main bundle free of this server-only dependency.
>
> If you use `MosaicClerkWebhookHandler` without installing `svix`, you will receive a **`MODULE_NOT_FOUND` runtime error** when your webhook route is called — not a compile-time error, because the import is deferred.
>
> **If you do not use `MosaicClerkWebhookHandler`, you do not need to install `svix`.**

Peer dependency matrix:

| Package | Required when | Version |
|---------|--------------|---------|
| `@clerk/nextjs` | Any auth component | `^7` |
| `@vantageos/cloud-identity` | `MosaicMultiTenantProvider`, `useEffectiveWorkspaceId` | `^0.2` |
| `svix` | `MosaicClerkWebhookHandler` only | `*` (latest stable) |

---

## Quick-start: multi-tenant auth in 4 steps

### Step 1 — Wrap with MosaicMultiTenantProvider

```tsx
// app/providers.tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { MosaicMultiTenantProvider } from "@vantageos/mosaic-blocks";
import { resolveWorkspaceId } from "@vantageos/cloud-identity";

export function Providers({ children }: { children: React.ReactNode }) {
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

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Step 2 — Add sign-in and sign-up pages

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { MosaicSignInLayout } from "@vantageos/mosaic-blocks";

export default function SignInPage() {
  return (
    <MosaicSignInLayout
      clerkSignIn={SignIn}
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      headline="Welcome back"
      subheadline="Sign in to your workspace"
    />
  );
}
```

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";
import { MosaicSignUpLayout } from "@vantageos/mosaic-blocks";

export default function SignUpPage() {
  return (
    <MosaicSignUpLayout
      clerkSignUp={SignUp}
      signInUrl="/sign-in"
      afterSignUpUrl="/onboarding"
    />
  );
}
```

### Step 3 — Add org switcher and user button

```tsx
// components/AppHeader.tsx
"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { MosaicClerkOrgSwitcher, MosaicUserButton } from "@vantageos/mosaic-blocks";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <MosaicClerkOrgSwitcher
        clerkOrgSwitcher={OrganizationSwitcher}
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        afterLeaveOrganizationUrl="/"
        hidePersonal={false}
      />
      <MosaicUserButton
        clerkUserButton={UserButton}
        afterSignOutUrl="/"
        showName={false}
      />
    </header>
  );
}
```

### Step 4 — Set up webhook sync to Convex

Install `svix` first:

```bash
npm install svix
```

```ts
// app/api/webhooks/clerk/route.ts
import { MosaicClerkWebhookHandler } from "@vantageos/mosaic-blocks";

export async function POST(req: Request) {
  return MosaicClerkWebhookHandler(req, {
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,

    onOrganizationCreated: async (org) => {
      // Sync to Convex: await convex.mutation(api.orgs.create, { ...org })
      console.log("Org created:", org.id, org.name);
    },

    onMembershipCreated: async (data) => {
      // Sync to Convex: await convex.mutation(api.memberships.add, { ... })
      console.log("Member joined:", data.publicUserData.userId, data.organization.id);
    },

    onMembershipDeleted: async (data) => {
      // Sync to Convex: await convex.mutation(api.memberships.remove, { ... })
      console.log("Member left:", data.publicUserData.userId, data.organization.id);
    },
  });
}
```

Register the webhook in the Clerk dashboard under **Webhooks**, pointing to `https://yourdomain.com/api/webhooks/clerk`. Set the `CLERK_WEBHOOK_SECRET` environment variable.

---

## Component reference

### MosaicSignInLayout

Mobile-first sign-in page layout with OKLCH-themed Clerk `<SignIn>` widget.

```ts
interface MosaicSignInLayoutProps {
  clerkSignIn: React.ComponentType<{
    appearance?: Record<string, unknown>;
    signUpUrl?: string;
    fallbackRedirectUrl?: string;
    [key: string]: unknown;
  }>;
  signUpUrl?: string;
  afterSignInUrl?: string;
  headline?: string;
  subheadline?: string;
  className?: string;
}
```

Clerk is injected as a prop so `@vantageos/mosaic-blocks` does not bundle `@clerk/nextjs` directly — the consumer controls the Clerk version.

### MosaicSignUpLayout

Mobile-first sign-up page layout with OKLCH-themed Clerk `<SignUp>` widget.

```ts
interface MosaicSignUpLayoutProps {
  clerkSignUp: React.ComponentType<{
    appearance?: Record<string, unknown>;
    signInUrl?: string;
    fallbackRedirectUrl?: string;
    [key: string]: unknown;
  }>;
  signInUrl?: string;
  afterSignUpUrl?: string;
  headline?: string;
  subheadline?: string;
  className?: string;
}
```

### MosaicClerkOrgSwitcher vs MosaicOrgSwitcher

These are two distinct components with different data sources:

| | `MosaicClerkOrgSwitcher` | `MosaicOrgSwitcher` |
|---|---|---|
| **Data source** | Clerk — reads live org memberships from Clerk session | Props — caller passes `organizations[]` array |
| **Auth dependency** | Requires `@clerk/nextjs` in scope | None — purely presentational |
| **Use when** | Inside an authenticated app shell | Building custom org pickers, demos, Storybook |
| **Clerk component** | `OrganizationSwitcher` injected via `clerkOrgSwitcher` prop | N/A |

```ts
// MosaicClerkOrgSwitcher props
interface MosaicClerkOrgSwitcherProps {
  clerkOrgSwitcher: React.ComponentType<{
    appearance?: Record<string, unknown>;
    afterCreateOrganizationUrl?: string;
    afterSelectOrganizationUrl?: string;
    afterLeaveOrganizationUrl?: string;
    hidePersonal?: boolean;
    [key: string]: unknown;
  }>;
  afterCreateOrganizationUrl?: string;
  afterSelectOrganizationUrl?: string;
  afterLeaveOrganizationUrl?: string;
  hidePersonal?: boolean;
  className?: string;
}

// MosaicOrgSwitcher props (presentational)
interface MosaicOrgSwitcherProps {
  organizations?: MosaicOrg[];    // { id, name, avatarUrl?, slug? }[]
  currentOrgId?: string;
  onSelectOrg?: (orgId: string) => void;
  onCreateOrg?: () => void;
  createOrgLabel?: string;
  className?: string;
}
```

### MosaicUserButton

```ts
interface MosaicUserButtonProps {
  clerkUserButton: React.ComponentType<{
    appearance?: Record<string, unknown>;
    afterSignOutUrl?: string;
    showName?: boolean;
    [key: string]: unknown;
  }>;
  afterSignOutUrl?: string;
  showName?: boolean;
  className?: string;
}
```

### MosaicOrgProfilePage

Renders Clerk's `<OrganizationProfile>` page for team management (members, roles, settings).

```ts
interface MosaicOrgProfilePageProps {
  clerkOrgProfile: React.ComponentType<{
    appearance?: Record<string, unknown>;
    routing?: "hash" | "path" | "virtual";
    path?: string;
    [key: string]: unknown;
  }>;
  routing?: "hash" | "path" | "virtual";
  path?: string;   // required when routing="path"
  className?: string;
}
```

---

## Multi-tenant: MosaicMultiTenantProvider

### How it works

`MosaicMultiTenantProvider` composes:
1. **Clerk** (`ClerkProvider`) — handles authentication, sessions, org membership
2. **`@vantageos/cloud-identity` 0.2.0** — provides workspace scope-filter primitives; the `resolveWorkspaceId` prop maps a Clerk org ID to an internal workspace ID

The provider resolves the effective workspace ID and exposes it via React context.

```ts
interface MosaicWorkspaceContext {
  workspaceId: string | null;
  isLoading: boolean;
}

interface MosaicMultiTenantProviderProps {
  children: React.ReactNode;
  clerkProvider: React.ComponentType<{
    publishableKey?: string;
    appearance?: Record<string, unknown>;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  publishableKey?: string;
  /**
   * Workspace ID resolver from @vantageos/cloud-identity.
   * Called with the current Clerk org ID (null = personal workspace).
   * Defaults to identity pass-through when not provided.
   */
  resolveWorkspaceId?: (orgId: string | null) => Promise<string | null> | string | null;
  initialOrgId?: string | null;
  appearance?: Record<string, unknown>;   // Clerk appearance override
}
```

### useMosaicWorkspace

Read the resolved workspace ID anywhere in the tree:

```tsx
"use client";
import { useMosaicWorkspace } from "@vantageos/mosaic-blocks";

function ConvexQueryWrapper() {
  const { workspaceId, isLoading } = useMosaicWorkspace();

  if (isLoading) return <Skeleton />;
  if (!workspaceId) return <UnauthorizedState />;

  // Use workspaceId to scope Convex queries
  const data = useQuery(api.items.list, { workspaceId });
  return <ItemList items={data} />;
}
```

### useEffectiveWorkspaceId

`useEffectiveWorkspaceId` is a re-export alias of `useMosaicWorkspace` for consumers who prefer the cloud-identity naming convention. Behaviour is identical.

```tsx
import { useEffectiveWorkspaceId } from "@vantageos/mosaic-blocks";

const { workspaceId } = useEffectiveWorkspaceId();
```

---

## MosaicClerkWebhookHandler

> **Requires `svix` installed in your app.** See "Installation and peer dependencies" above.

A pure async function (not a React component) for use in Next.js App Router API route handlers. Verifies Clerk webhook signatures via `svix`, then dispatches events to your callbacks.

```ts
type MosaicClerkWebhookHandlerOptions = {
  webhookSecret: string;
  onOrganizationCreated?: (org: MosaicClerkOrganization) => Promise<void> | void;
  onMembershipCreated?: (data: MosaicClerkMembership) => Promise<void> | void;
  onMembershipDeleted?: (data: MosaicClerkMembership) => Promise<void> | void;
};

// Returns Promise<Response> — compatible with Next.js App Router route handlers
MosaicClerkWebhookHandler(req: Request, options: MosaicClerkWebhookHandlerOptions): Promise<Response>
```

**Events handled:**

| Clerk event | Callback |
|---|---|
| `organization.created` | `onOrganizationCreated(org: MosaicClerkOrganization)` |
| `organizationMembership.created` | `onMembershipCreated(data: MosaicClerkMembership)` |
| `organizationMembership.deleted` | `onMembershipDeleted(data: MosaicClerkMembership)` |

**Error handling:** returns `HTTP 400` for missing/invalid svix headers or failed signature verification; `HTTP 500` for missing `svix` package or handler errors.

**Implementation note:** `svix` is imported via a runtime dynamic import using a computed string (`const svixPkg = "svix"`) to prevent TypeScript from statically resolving and bundling it. If `svix` is not installed, the handler returns a `500` response with a clear error message instead of crashing the process.

---

## RBAC — role-based access control

Clerk handles RBAC via organization roles. Roles are available in Clerk's session claims. mosaic-blocks provides `MosaicOrgRoleBadge` (visual display) but does not implement access-control logic — use Clerk's middleware for route protection.

```tsx
// middleware.ts — Clerk route protection
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/settings(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
```

For displaying member roles visually:

```tsx
import { MosaicOrgRoleBadge } from "@vantageos/mosaic-blocks";

<MosaicOrgRoleBadge role="admin" />   // "owner" | "admin" | "member"
```

---

## Clerk appearance — OKLCH tokens

All auth components inject a pre-configured OKLCH appearance object into their respective Clerk components. The appearance reads from CSS custom properties (`--primary`, `--background`, `--foreground`, etc.) so it adapts automatically to light/dark mode when used with `MosaicThemeProvider`.

You can override the appearance by passing `appearance` to `MosaicMultiTenantProvider`:

```tsx
<MosaicMultiTenantProvider
  clerkProvider={ClerkProvider}
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  appearance={{
    variables: {
      colorPrimary: "oklch(0.6 0.2 250)",
      borderRadius: "0.75rem",
    },
  }}
>
  {children}
</MosaicMultiTenantProvider>
```

---

## Migration note: anydebate → cloud-identity scope

The auth components in `@vantageos/mosaic-blocks` were ported from the `any-debate-ai` upstream repository (`dev` branch) as part of the `mosaic-blocks-absorb-anydebate-v1` mission (T1.5).

**What changed for consumers:**

| anydebate upstream | mosaic-blocks |
|---|---|
| `DeviceProvider` (internal, debate-specific) | `MosaicDeviceProvider` (generic, exported) |
| `contexts/DeviceProvider.tsx` | `@vantageos/mosaic-blocks` (named import) |
| Hardcoded Clerk `publishableKey` | Injected via `MosaicMultiTenantProvider` props |
| Internal `workspaceId` resolution | Delegates to `@vantageos/cloud-identity` 0.2.0 `resolveWorkspaceId` |
| `OrganizationSwitcher` (Clerk direct) | `MosaicClerkOrgSwitcher` (Clerk injected as prop) |
| Webhook handler in `/api/webhooks/clerk/route.ts` | `MosaicClerkWebhookHandler` (importable function) |
| `svix` bundled transitively | `svix` must be installed explicitly — `MODULE_NOT_FOUND` if missing |

No debate-specific business logic was ported. The UI shell, layout, and auth plumbing are fully generic.

---

## Environment variables

The following environment variables are required in your consuming app:

```bash
# .env.local

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...   # Required only for MosaicClerkWebhookHandler

# Sign-in / sign-up URL configuration (Clerk defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```
