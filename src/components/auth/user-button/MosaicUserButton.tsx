"use client";

/**
 * MosaicUserButton — Clerk <UserButton> with OKLCH-token appearance.
 *
 * Wraps @clerk/nextjs <UserButton>. Clerk is injected as a peer prop so
 * mosaic-blocks does not bundle @clerk/nextjs directly.
 *
 * @example
 * import { UserButton } from "@clerk/nextjs"
 * <MosaicUserButton clerkUserButton={UserButton} />
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicUserButtonProps {
  /** Clerk <UserButton> component — injected by caller to avoid bundling Clerk */
  clerkUserButton: React.ComponentType<{
    appearance?: Record<string, unknown>;
    afterSignOutUrl?: string;
    showName?: boolean;
    [key: string]: unknown;
  }>;
  /** URL to redirect after sign-out */
  afterSignOutUrl?: string;
  /** Show the user's name next to avatar */
  showName?: boolean;
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
    avatarBox: "ring-2 ring-border",
    userButtonPopoverCard: "border border-border bg-popover shadow-md",
    userButtonPopoverActions: "border-t border-border",
    userButtonPopoverActionButton:
      "text-foreground hover:bg-accent hover:text-accent-foreground text-sm",
    userButtonPopoverActionButtonText: "text-foreground",
    userButtonPopoverFooter: "border-t border-border",
    userPreviewMainIdentifier: "text-foreground font-medium",
    userPreviewSecondaryIdentifier: "text-muted-foreground text-xs",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicUserButton({
  clerkUserButton: ClerkUserButton,
  afterSignOutUrl = "/",
  showName = false,
  className,
}: MosaicUserButtonProps) {
  return (
    <div data-slot="user-button" className={className}>
      <ClerkUserButton
        appearance={clerkAppearance}
        afterSignOutUrl={afterSignOutUrl}
        showName={showName}
      />
    </div>
  );
}

MosaicUserButton.displayName = "MosaicUserButton";
