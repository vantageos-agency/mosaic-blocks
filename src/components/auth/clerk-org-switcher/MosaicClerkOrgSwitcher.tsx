"use client";

/**
 * MosaicClerkOrgSwitcher — Clerk-backed org switcher (live org data from Clerk).
 *
 * Wraps @clerk/nextjs <OrganizationSwitcher> with OKLCH-token appearance prop.
 * Clerk is injected as a peer prop.
 *
 * DISTINCT from MosaicOrgSwitcher (presentational, orgs via props — no Clerk dep).
 * Use this component when you need live Clerk org data; use MosaicOrgSwitcher
 * for pure presentational rendering driven by your own data.
 *
 * @example
 * import { OrganizationSwitcher } from "@clerk/nextjs"
 * <MosaicClerkOrgSwitcher clerkOrgSwitcher={OrganizationSwitcher} />
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicClerkOrgSwitcherProps {
  /**
   * Clerk <OrganizationSwitcher> component — injected by caller.
   * Clerk-backed (live org data). Distinct from MosaicOrgSwitcher (presentational).
   */
  clerkOrgSwitcher: React.ComponentType<{
    appearance?: Record<string, unknown>;
    afterCreateOrganizationUrl?: string;
    afterSelectOrganizationUrl?: string;
    afterSelectPersonalUrl?: string;
    afterLeaveOrganizationUrl?: string;
    hidePersonal?: boolean;
    [key: string]: unknown;
  }>;
  /** URL to redirect after creating an org */
  afterCreateOrganizationUrl?: string;
  /** URL to redirect after selecting an org */
  afterSelectOrganizationUrl?: string;
  /**
   * URL to redirect after selecting the personal workspace.
   * Required for VP patterns where personal workspace has a distinct landing page.
   */
  afterSelectPersonalUrl?: string;
  /** URL to redirect after leaving an org */
  afterLeaveOrganizationUrl?: string;
  /** Hide personal workspace from the switcher */
  hidePersonal?: boolean;
  /**
   * data-testid forwarded onto the root wrapper div.
   * Allows e2e selectors (e.g. Playwright `getByTestId("org-switcher")`).
   */
  "data-testid"?: string;
  className?: string;
}

// ── Clerk OKLCH appearance tokens ─────────────────────────────────────────────

const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--popover)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorNeutral: "var(--foreground)",
    borderRadius: "0.375rem",
  },
  elements: {
    organizationSwitcherTrigger:
      "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium focus:ring-ring",
    organizationPreviewAvatarBox: "rounded bg-primary text-primary-foreground",
    organizationSwitcherPopoverCard: "border border-border bg-popover shadow-md",
    organizationSwitcherPopoverActions: "border-t border-border text-sm text-foreground",
    organizationSwitcherPopoverActionButton:
      "text-foreground hover:bg-accent hover:text-accent-foreground",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicClerkOrgSwitcher({
  clerkOrgSwitcher: ClerkOrgSwitcher,
  afterCreateOrganizationUrl = "/",
  afterSelectOrganizationUrl = "/",
  afterSelectPersonalUrl,
  afterLeaveOrganizationUrl = "/",
  hidePersonal = false,
  "data-testid": dataTestId,
  className,
}: MosaicClerkOrgSwitcherProps) {
  return (
    <div
      data-slot="clerk-org-switcher"
      {...(dataTestId !== undefined && { "data-testid": dataTestId })}
      className={className}
    >
      <ClerkOrgSwitcher
        appearance={clerkAppearance}
        afterCreateOrganizationUrl={afterCreateOrganizationUrl}
        afterSelectOrganizationUrl={afterSelectOrganizationUrl}
        {...(afterSelectPersonalUrl !== undefined && { afterSelectPersonalUrl })}
        afterLeaveOrganizationUrl={afterLeaveOrganizationUrl}
        hidePersonal={hidePersonal}
      />
    </div>
  );
}

MosaicClerkOrgSwitcher.displayName = "MosaicClerkOrgSwitcher";
