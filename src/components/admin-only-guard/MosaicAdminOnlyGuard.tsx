"use client";

/**
 * MosaicAdminOnlyGuard — permission gate that renders `children` for admins,
 * an access-denied card for non-admins, and a loading fallback while
 * permissions resolve, EveVantage M3 C7.
 *
 * Reuse: ported from any-debate-ai —
 * components/organization/admin-only-guard.tsx — stripped of its
 * `next/navigation` `useRouter`, its mock `useOrganizationContext` Clerk
 * fixture, its `useDevice()` JS branch, and its shadcn/ui `Button` / `lucide-react`
 * icon imports. Button primitive reused from this repo's own `MosaicButton`
 * (`src/components/button/Button.tsx`) rather than a fresh port.
 *
 * The gate is a pure, prop-driven display: the host supplies `isAdmin` and
 * `isLoaded` (from wherever it resolves organization membership) and, when it
 * wants an exit affordance on the denied state, an `onExit` handler. There is
 * no backend, no fetch, no router — the host owns navigation from `onExit`.
 *
 * Responsive sizing (icon dimensions) is done via Tailwind breakpoints
 * (`size-16 md:size-20`), never via a `useDevice()` JS branch — see
 * `MosaicOrgContextDisplay` for the rationale (jsdom's `matchMedia` always
 * reports non-matching, so a JS-branched "desktop-only" size is permanently
 * wrong under test).
 *
 * data-slot="admin-only-guard" on the denied-state root.
 *
 * i18n: zero hardcoded user-facing strings (mosaic-blocks doctrine — see
 * src/__tests__/i18n-no-hardcoded-literals.test.ts). Every label is a
 * required prop; the host owns the language.
 */

import type * as React from "react";
import { MosaicButton } from "../button/Button.js";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

function ShieldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3 shrink-0 md:size-4"
    >
      <path d="M20 13c0 5-3.5 7.5-7.35 8.95a1 1 0 0 1-1.3 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.79 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-8 shrink-0 text-destructive md:size-10"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export interface MosaicAdminOnlyGuardBaseProps {
  /** Content rendered only when `isAdmin` is true. */
  children: React.ReactNode;
  /** Whether the current user holds the admin role. */
  isAdmin: boolean;
  /** Whether permission resolution has completed. `false` renders `loadingFallback`. */
  isLoaded: boolean;
  /** Host-owned title for the access-denied card (e.g. "Admin Access Required"). Required, no default. */
  title: string;
  /** Host-owned description for the access-denied card. Required, no default. */
  description: string;
  /** Host-owned label for the required-role badge (e.g. "Required role: Admin"). Required, no default. */
  requiredRoleLabel: string;
  /** Rendered while `isLoaded` is false. Defaults to a minimal spinner div. */
  loadingFallback?: React.ReactNode;
  className?: string;
}

/**
 * Discriminated union on `onExit` — the exit button only ever renders on
 * the branch where an exit handler is supplied, so its accessible-name
 * props are required EXACTLY there, never on the branch without a handler.
 * See `MosaicOrgContextDisplaySwitchProps` for the same repo-wide pattern.
 */
export type MosaicAdminOnlyGuardExitProps =
  | {
      /** Invoked by the exit button, and once automatically when a non-admin's permissions finish loading. */
      onExit: () => void;
      /** Visible label on the exit button (e.g. "Back to Dashboard"). Required — the button renders whenever `onExit` is provided. */
      exitLabel: string;
      /** Accessible name for the exit button. Required — the button renders whenever `onExit` is provided. */
      exitAriaLabel: string;
    }
  | {
      /** Omit to render the denied card with no exit button. */
      onExit?: undefined;
    };

export type MosaicAdminOnlyGuardProps = MosaicAdminOnlyGuardBaseProps &
  MosaicAdminOnlyGuardExitProps;

function DefaultLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      <div
        role="status"
        aria-label="loading"
        className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary md:size-10"
      />
    </div>
  );
}

export function MosaicAdminOnlyGuard(props: MosaicAdminOnlyGuardProps) {
  const {
    children,
    isAdmin,
    isLoaded,
    title,
    description,
    requiredRoleLabel,
    loadingFallback,
    className,
  } = props;

  if (!isLoaded) {
    return <>{loadingFallback ?? <DefaultLoadingFallback />}</>;
  }

  if (!isAdmin) {
    return (
      <div
        data-slot="admin-only-guard"
        className={cn(
          "flex min-h-screen flex-col items-center justify-center p-4 md:p-8",
          className,
        )}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-6 md:gap-6 md:p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 md:size-20">
            <AlertTriangleIcon />
          </div>

          <h2 className="text-center font-semibold text-lg md:text-xl">{title}</h2>

          <p className="text-center text-muted-foreground text-sm md:text-base">{description}</p>

          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-primary text-xs md:text-sm">
            <ShieldIcon />
            <span className="font-medium">{requiredRoleLabel}</span>
          </div>

          {props.onExit ? (
            <MosaicButton
              onClick={props.onExit}
              aria-label={props.exitAriaLabel}
              className="mt-2 min-h-[44px] w-full"
            >
              <ArrowLeftIcon />
              {props.exitLabel}
            </MosaicButton>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

MosaicAdminOnlyGuard.displayName = "MosaicAdminOnlyGuard";
