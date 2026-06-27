"use client";

/**
 * MosaicOrgProfilePage — Clerk <OrganizationProfile> with OKLCH appearance.
 *
 * Wraps @clerk/nextjs <OrganizationProfile> for team management. Clerk is
 * injected as a peer prop so mosaic-blocks does not bundle @clerk/nextjs.
 *
 * @example
 * import { OrganizationProfile } from "@clerk/nextjs"
 * <MosaicOrgProfilePage clerkOrgProfile={OrganizationProfile} />
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicOrgProfilePageProps {
  /** Clerk <OrganizationProfile> component — injected by caller */
  clerkOrgProfile: React.ComponentType<{
    appearance?: Record<string, unknown>;
    routing?: "hash" | "path" | "virtual";
    path?: string;
    [key: string]: unknown;
  }>;
  /** Routing mode for Clerk's internal navigation */
  routing?: "hash" | "path" | "virtual";
  /** Base path when routing="path" */
  path?: string;
  className?: string;
}

// ── Clerk OKLCH appearance tokens ─────────────────────────────────────────────

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--background)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorNeutral: "var(--foreground)",
    borderRadius: "0.5rem",
  },
  elements: {
    card: "shadow-none border border-border bg-card",
    headerTitle: "text-foreground font-semibold",
    headerSubtitle: "text-muted-foreground",
    navbar: "border-r border-border bg-background",
    navbarButton: "text-foreground hover:bg-accent hover:text-accent-foreground",
    navbarButtonIcon: "text-muted-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none",
    formButtonReset:
      "border border-border text-foreground hover:bg-accent hover:text-accent-foreground",
    formFieldInput: "border-input bg-background text-foreground focus:ring-ring",
    badge: "bg-secondary text-secondary-foreground",
    table: "text-foreground",
    tableHead: "text-muted-foreground text-xs font-medium",
    memberListTableRow: "border-b border-border",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicOrgProfilePage({
  clerkOrgProfile: ClerkOrgProfile,
  routing = "hash",
  path,
  className,
}: MosaicOrgProfilePageProps) {
  return (
    <div
      data-slot="org-profile-page"
      className={["flex min-h-0 flex-1 flex-col bg-background", className]
        .filter(Boolean)
        .join(" ")}
    >
      <ClerkOrgProfile
        appearance={clerkAppearance}
        routing={routing}
        {...(path !== undefined ? { path } : {})}
      />
    </div>
  );
}

MosaicOrgProfilePage.displayName = "MosaicOrgProfilePage";
