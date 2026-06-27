"use client";

/**
 * MosaicOrgSwitcher — presentational org picker dropdown
 *
 * Ported from components/dashboard/OrgSwitcher.tsx (which used Clerk's
 * OrganizationSwitcher). Clerk STRIPPED. Pure presentational shell.
 *
 * Features:
 * - Dropdown with list of organizations
 * - Current org name + avatar/initials displayed in trigger
 * - Optional "Create organization" action at bottom
 *
 * Data comes entirely via props. Auth wiring is T1.5.
 */

import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicOrg {
  id: string;
  name: string;
  avatarUrl?: string;
  slug?: string;
}

export interface MosaicOrgSwitcherProps {
  organizations?: MosaicOrg[];
  currentOrgId?: string;
  onSelectOrg?: (orgId: string) => void;
  onCreateOrg?: () => void;
  createOrgLabel?: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicOrgSwitcher({
  organizations = [],
  currentOrgId,
  onSelectOrg,
  onCreateOrg,
  createOrgLabel = "Create organization",
  className,
}: MosaicOrgSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const currentOrg = organizations.find((o) => o.id === currentOrgId) ?? organizations[0];

  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!currentOrg && organizations.length === 0 && !onCreateOrg) return null;

  const initials =
    currentOrg?.name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div ref={ref} data-slot="org-switcher" className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5",
          "text-sm font-medium text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground overflow-hidden">
          {currentOrg?.avatarUrl ? (
            <img
              src={currentOrg.avatarUrl}
              alt={currentOrg.name}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <span className="max-w-[120px] truncate">{currentOrg?.name ?? "Select org"}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select organization"
          className={cn(
            "absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-border",
            "bg-popover py-1 shadow-md",
          )}
        >
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              role="menuitem"
              aria-current={org.id === currentOrgId ? "true" : undefined}
              onClick={() => {
                onSelectOrg?.(org.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground",
                "hover:bg-accent hover:text-accent-foreground",
                org.id === currentOrgId && "bg-primary/10 text-primary",
              )}
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground overflow-hidden">
                {org.avatarUrl ? (
                  <img src={org.avatarUrl} alt={org.name} className="h-full w-full object-cover" />
                ) : (
                  org.name[0]?.toUpperCase()
                )}
              </span>
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === currentOrgId && <CheckIcon />}
            </button>
          ))}

          {onCreateOrg && (
            <>
              {organizations.length > 0 && <div className="my-1 border-t border-border" />}
              <button
                type="button"
                onClick={() => {
                  onCreateOrg();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <PlusIcon />
                {createOrgLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

MosaicOrgSwitcher.displayName = "MosaicOrgSwitcher";
