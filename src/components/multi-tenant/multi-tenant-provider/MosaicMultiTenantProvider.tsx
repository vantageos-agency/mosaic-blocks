"use client";

/**
 * MosaicMultiTenantProvider — wraps <ClerkProvider> with cloud-identity
 * workspace-scope context.
 *
 * Clerk and the workspace-id resolver are injected as peer props so
 * mosaic-blocks does not bundle @clerk/nextjs or @vantageos/cloud-identity.
 *
 * @example
 * import { ClerkProvider } from "@clerk/nextjs"
 * import { getEffectiveWorkspaceId } from "@vantageos/cloud-identity"
 * <MosaicMultiTenantProvider
 *   clerkProvider={ClerkProvider}
 *   publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
 * >
 *   {children}
 * </MosaicMultiTenantProvider>
 */

import * as React from "react";

// ── Context ───────────────────────────────────────────────────────────────────

export interface MosaicWorkspaceContext {
  workspaceId: string | null;
  isLoading: boolean;
}

const WorkspaceCtx = React.createContext<MosaicWorkspaceContext>({
  workspaceId: null,
  isLoading: false,
});

/** Access the resolved workspace ID from any child component. */
export function useMosaicWorkspace(): MosaicWorkspaceContext {
  return React.useContext(WorkspaceCtx);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicMultiTenantProviderProps {
  children: React.ReactNode;
  /** Clerk <ClerkProvider> component — injected by caller */
  clerkProvider: React.ComponentType<{
    publishableKey?: string;
    appearance?: Record<string, unknown>;
    children?: React.ReactNode;
    [key: string]: unknown;
  }>;
  /** Clerk publishable key */
  publishableKey?: string;
  /**
   * Optional workspace-ID resolver from @vantageos/cloud-identity.
   * Called with the current Clerk org ID (or null for personal workspace).
   * Defaults to identity pass-through when not provided.
   */
  resolveWorkspaceId?: (orgId: string | null) => Promise<string | null> | string | null;
  /** Initial org ID hint (e.g. from URL slug) */
  initialOrgId?: string | null;
  /** Clerk appearance override */
  appearance?: Record<string, unknown>;
}

// ── Default OKLCH Clerk appearance ────────────────────────────────────────────

const defaultClerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--background)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorNeutral: "var(--foreground)",
    borderRadius: "0.5rem",
  },
};

// ── Inner workspace resolver ──────────────────────────────────────────────────

interface WorkspaceResolverProps {
  resolveWorkspaceId: MosaicMultiTenantProviderProps["resolveWorkspaceId"];
  initialOrgId: string | null | undefined;
  children: React.ReactNode;
}

function WorkspaceResolver({ resolveWorkspaceId, initialOrgId, children }: WorkspaceResolverProps) {
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!resolveWorkspaceId) {
      setWorkspaceId(initialOrgId ?? null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const result = resolveWorkspaceId(initialOrgId ?? null);
    if (result instanceof Promise) {
      result
        .then((id) => {
          if (!cancelled) {
            setWorkspaceId(id);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setWorkspaceId(null);
            setIsLoading(false);
          }
        });
    } else {
      setWorkspaceId(result);
      setIsLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [resolveWorkspaceId, initialOrgId]);

  return (
    <WorkspaceCtx.Provider value={{ workspaceId, isLoading }}>{children}</WorkspaceCtx.Provider>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicMultiTenantProvider({
  children,
  clerkProvider: ClerkProvider,
  publishableKey,
  resolveWorkspaceId,
  initialOrgId,
  appearance,
}: MosaicMultiTenantProviderProps) {
  const mergedAppearance = appearance ?? defaultClerkAppearance;

  return (
    <ClerkProvider publishableKey={publishableKey} appearance={mergedAppearance}>
      <WorkspaceResolver resolveWorkspaceId={resolveWorkspaceId} initialOrgId={initialOrgId}>
        <div data-slot="multi-tenant-provider">{children}</div>
      </WorkspaceResolver>
    </ClerkProvider>
  );
}

MosaicMultiTenantProvider.displayName = "MosaicMultiTenantProvider";
