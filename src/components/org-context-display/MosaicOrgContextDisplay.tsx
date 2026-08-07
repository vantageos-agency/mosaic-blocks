"use client";

/**
 * MosaicOrgContextDisplay — active organization (cloisonnement) indicator +
 * switcher, EveVantage M3 C6.
 *
 * Reuse: ported from any-debate-ai —
 * components/organization/org-context-display.tsx — stripped of its
 * `mockOrgContext` fixture, `useDevice` project-local import path, and
 * shadcn/ui `Button`. The role badge is reused from this repo's own
 * `MosaicOrgRoleBadge` (`org-panel/MosaicOrgPanel.tsx`) rather than a second
 * port of `role-badge.tsx` — the component already ships here.
 *
 * The panel is a pure, prop-driven display: the host supplies the active
 * organization state (`org`) plus, when the host allows switching, an
 * `onSwitchOrg` handler. There is no backend, no fetch, no hardcoded org
 * data — the host owns fetching the org, computing membership, and driving
 * the switch flow (dialog, route change, etc.) from `onSwitchOrg`.
 *
 * The role badge and member-count caption are hidden below the `md`
 * breakpoint via Tailwind (`hidden md:...`), never via a `useDevice()`
 * JS branch — this repo's device hooks resolve via `matchMedia`, which the
 * jsdom test environment always reports as non-matching, so a JS-branched
 * "desktop-only" element would be permanently hidden under test.
 *
 * data-slot="org-context-display" on the root.
 *
 * i18n: zero hardcoded user-facing strings (mosaic-blocks doctrine — see
 * src/__tests__/i18n-no-hardcoded-literals.test.ts). Every label is a
 * required prop; the host owns the language.
 */

import type * as React from "react";
import type { MosaicOrgRole } from "../org-panel/MosaicOrgPanel.js";
import { MosaicOrgRoleBadge } from "../org-panel/MosaicOrgPanel.js";

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface MosaicOrgContextInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  memberCount: number;
  role: MosaicOrgRole;
}

export interface MosaicOrgContextDisplayBaseProps {
  /** The currently active organization (the cloisonnement/partitioning state this display reflects). */
  org: MosaicOrgContextInfo;
  /** Host-owned display label for `org.role` (e.g. "Admin" / "Administrateur"). Required, no default. */
  roleLabel: string;
  /** Host-owned description rendered as the role badge's `title` tooltip. Required, no default. */
  roleDescription: string;
  /** Host-formatted member-count caption, e.g. `(count) => `${count} members`` or a pluralized `t()` call. Required, no default. */
  memberCountLabel: (count: number) => React.ReactNode;
  className?: string;
}

/**
 * Discriminated union on `onSwitchOrg` — the switch control only ever
 * renders on the branch where a switch handler is supplied, so its
 * accessible-name prop is required EXACTLY there, never on the read-only
 * branch. See `MosaicArtifactVersionHistoryRestoreProps` (C6 retrofit) and
 * `MosaicMemoryCardVariantProps` for the same repo-wide pattern.
 */
export type MosaicOrgContextDisplaySwitchProps =
  | {
      /** Invoked when the host should present the org-switch UI. */
      onSwitchOrg: () => void;
      /**
       * Accessible name for the switch control, reflecting the currently
       * active org (e.g. `Switch organization, current: ${org.name}`).
       * Required — the control renders whenever `onSwitchOrg` is provided.
       */
      switchAriaLabel: string;
    }
  | {
      /** Omit to render a read-only display — no switch control at all. */
      onSwitchOrg?: undefined;
    };

export type MosaicOrgContextDisplayProps = MosaicOrgContextDisplayBaseProps &
  MosaicOrgContextDisplaySwitchProps;

function ChevronDownIcon() {
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
      className="h-4 w-4 shrink-0 text-muted-foreground"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function OrgAvatar({ org }: { org: MosaicOrgContextInfo }) {
  if (org.avatarUrl) {
    return (
      <img
        src={org.avatarUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover md:h-10 md:w-10"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 md:h-10 md:w-10">
      <span aria-hidden="true" className="text-primary text-sm font-medium">
        {org.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export function MosaicOrgContextDisplay(props: MosaicOrgContextDisplayProps) {
  const { org, roleLabel, roleDescription, memberCountLabel, className } = props;

  const content = (
    <>
      <OrgAvatar org={org} />
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm md:text-base">{org.name}</span>
          <span className="hidden md:inline-flex">
            <MosaicOrgRoleBadge role={org.role} label={roleLabel} description={roleDescription} />
          </span>
        </div>
        <div className="hidden text-muted-foreground text-xs md:block">
          {memberCountLabel(org.memberCount)}
        </div>
      </div>
    </>
  );

  if (!props.onSwitchOrg) {
    return (
      <div
        data-slot="org-context-display"
        className={cn("flex w-full items-center gap-3 min-h-[44px] p-2 md:p-3", className)}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-slot="org-context-display"
      onClick={props.onSwitchOrg}
      aria-label={props.switchAriaLabel}
      className={cn(
        "flex w-full items-center gap-3 justify-start rounded-md border border-border",
        "outline-none transition-colors hover:bg-accent min-h-[44px] p-2 md:p-3",
        "focus-visible:ring-[3px] focus-visible:ring-ring",
        className,
      )}
    >
      {content}
      <ChevronDownIcon />
    </button>
  );
}

MosaicOrgContextDisplay.displayName = "MosaicOrgContextDisplay";
