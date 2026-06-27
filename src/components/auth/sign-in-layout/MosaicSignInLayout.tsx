"use client";

/**
 * MosaicSignInLayout — sign-in page layout, themed, mobile-first.
 *
 * Wraps Clerk <SignIn> with OKLCH-token appearance prop. Clerk is injected as a
 * peer prop so mosaic-blocks does not bundle @clerk/nextjs directly.
 *
 * @example
 * import { SignIn } from "@clerk/nextjs"
 * <MosaicSignInLayout clerkSignIn={SignIn} />
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSignInLayoutProps {
  /** Clerk <SignIn> component — injected by caller to avoid bundling Clerk */
  clerkSignIn: React.ComponentType<{
    appearance?: Record<string, unknown>;
    signUpUrl?: string;
    signInUrl?: string;
    fallbackRedirectUrl?: string;
    forceRedirectUrl?: string;
    routing?: "hash" | "path" | "virtual";
    path?: string;
    [key: string]: unknown;
  }>;
  /** URL for sign-up page */
  signUpUrl?: string;
  /** URL for sign-in page (passed to the Clerk widget as signInUrl) */
  signInUrl?: string;
  /** URL to redirect after successful sign-in (Clerk v7 fallbackRedirectUrl) */
  afterSignInUrl?: string;
  /** Force redirect URL — overrides query-param-based redirects (Clerk v7) */
  forceRedirectUrl?: string;
  /**
   * Clerk routing mode for catch-all routes.
   * Required for [[...sign-in]] App Router pages. Defaults to "path" when path is set.
   */
  routing?: "hash" | "path" | "virtual";
  /**
   * Base path for "path" routing (e.g. "/sign-in").
   * Required when routing="path".
   */
  path?: string;
  /** Optional headline above the Clerk widget */
  headline?: string;
  /** Optional sub-headline */
  subheadline?: string;
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
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none",
    formFieldInput: "border-input bg-background text-foreground focus:ring-ring",
    footerActionLink: "text-primary hover:text-primary/80",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-xs",
    socialButtonsBlockButton:
      "border-border text-foreground hover:bg-accent hover:text-accent-foreground",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicSignInLayout({
  clerkSignIn: ClerkSignIn,
  signUpUrl = "/sign-up",
  signInUrl,
  afterSignInUrl = "/",
  forceRedirectUrl,
  routing,
  path,
  headline,
  subheadline,
  className,
}: MosaicSignInLayoutProps) {
  return (
    <div
      data-slot="sign-in-layout"
      className={[
        "flex min-h-svh flex-col items-center justify-center",
        "bg-background px-4 py-12 sm:px-6 lg:px-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(headline ?? subheadline) && (
        <div className="mb-8 text-center">
          {headline && (
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {headline}
            </h1>
          )}
          {subheadline && <p className="mt-2 text-sm text-muted-foreground">{subheadline}</p>}
        </div>
      )}
      <div className="w-full max-w-sm">
        <ClerkSignIn
          appearance={clerkAppearance}
          signUpUrl={signUpUrl}
          {...(signInUrl !== undefined && { signInUrl })}
          fallbackRedirectUrl={afterSignInUrl}
          {...(forceRedirectUrl !== undefined && { forceRedirectUrl })}
          {...(routing !== undefined && { routing })}
          {...(path !== undefined && { path })}
        />
      </div>
    </div>
  );
}

MosaicSignInLayout.displayName = "MosaicSignInLayout";
