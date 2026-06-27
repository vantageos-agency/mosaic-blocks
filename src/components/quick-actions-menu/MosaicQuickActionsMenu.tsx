"use client";

/**
 * MosaicQuickActionsMenu — generic dropdown quick-actions button
 *
 * Ported from components/dashboard/QuickActionsMenu.tsx
 *
 * Features:
 * - Dropdown menu triggered by a "+" button
 * - Action items with icon + label
 * - Separator support
 * - Mobile-aware width
 * - All hrefs/routes are props (no next/link hardcoded)
 *
 * next/Link removed → renderItem prop or href + onClick.
 * All debate-specific actions stripped — items are generic props.
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicQuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  /** If true, renders a separator BEFORE this item */
  separator?: boolean;
}

export interface MosaicQuickActionsMenuProps {
  actions?: MosaicQuickAction[];
  /** Trigger button label (hidden on mobile when icon-only) */
  label?: string;
  /** Custom trigger icon */
  triggerIcon?: React.ReactNode;
  /** Menu header label */
  menuTitle?: string;
  /** Custom link renderer for href items */
  renderLink?: (
    action: MosaicQuickAction,
    children: React.ReactNode,
    className: string,
  ) => React.ReactNode;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function PlusIcon() {
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
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Default actions (generic) ─────────────────────────────────────────────────

const DEFAULT_ACTIONS: MosaicQuickAction[] = [];

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicQuickActionsMenu({
  actions = DEFAULT_ACTIONS,
  label = "Quick Actions",
  triggerIcon,
  menuTitle = "Quick Actions",
  renderLink,
  className,
}: MosaicQuickActionsMenuProps) {
  const { isMobile } = useDevice();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const itemClass = cn(
    "flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "min-h-[44px]",
  );

  return (
    <div ref={ref} data-slot="quick-actions-menu" className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background",
          "min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-medium text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        {triggerIcon ?? <PlusIcon />}
        <span className={cn("hidden md:inline")}>{label}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={menuTitle}
          className={cn(
            "absolute right-0 top-full z-50 mt-1 rounded-md border border-border bg-popover py-1 shadow-md",
            isMobile ? "w-[min(90vw,280px)]" : "w-56",
          )}
        >
          {menuTitle && (
            <div className="px-3 py-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {menuTitle}
              </p>
            </div>
          )}
          <div className={cn(menuTitle && "border-t border-border")} />

          {actions.map((action) => (
            <React.Fragment key={action.id}>
              {action.separator && <div className="my-1 border-t border-border" />}
              {action.href && renderLink ? (
                renderLink(
                  action,
                  <>
                    {action.icon}
                    {action.label}
                  </>,
                  itemClass,
                )
              ) : action.href ? (
                <a href={action.href} className={itemClass} onClick={() => setOpen(false)}>
                  {action.icon}
                  {action.label}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    action.onClick?.();
                    setOpen(false);
                  }}
                  className={itemClass}
                >
                  {action.icon}
                  {action.label}
                </button>
              )}
            </React.Fragment>
          ))}

          {actions.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No actions available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

MosaicQuickActionsMenu.displayName = "MosaicQuickActionsMenu";
