"use client";

/**
 * MosaicMainNav — generic responsive top-nav
 *
 * Ported from components/layout/main-nav.tsx
 *
 * Desktop: inline horizontal link strip.
 * Mobile: hamburger → slide-out drawer (pure CSS, no Radix Sheet dep).
 * All nav items, branding, and hrefs are props — zero hardcoded debate routes.
 * next/link replaced with `renderLink` prop (default: <a> tag).
 * Respects prefers-reduced-motion.
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicNavItem {
  href: string;
  label: string;
  /** Lucide-compatible icon component */
  icon?: React.ElementType;
  /** If true, only rendered when isAdmin=true */
  adminOnly?: boolean;
  /** Whether this item is currently active */
  isActive?: boolean;
}

export interface MosaicMainNavProps {
  items?: MosaicNavItem[];
  /** Current pathname for active-state matching (if items don't carry isActive) */
  activePath?: string;
  /** When true, adminOnly items are shown */
  isAdmin?: boolean;
  /** Custom link renderer (e.g. Next.js Link). Defaults to <a>. */
  renderLink?: (
    item: MosaicNavItem,
    children: React.ReactNode,
    className: string,
    onClick?: () => void,
  ) => React.ReactNode;
  /** Mobile drawer title */
  drawerTitle?: string;
  /** Mobile drawer subtitle */
  drawerSubtitle?: string;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  openMenuAriaLabel: string;
  closeMenuAriaLabel: string;
  drawerNavAriaLabel: string;
  mainNavAriaLabel: string;
  adminBadgeLabel: string;
  className?: string;
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-main-nav-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-drawer-in {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    @keyframes mosaic-drawer-out {
      from { transform: translateX(0); }
      to   { transform: translateX(-100%); }
    }
    .mosaic-nav-drawer[data-open="true"] {
      animation: mosaic-drawer-in 220ms ease-out forwards;
    }
    .mosaic-nav-drawer[data-open="false"] {
      animation: mosaic-drawer-out 180ms ease-in forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-nav-drawer { animation: none !important; }
    }
  `;
  document.head.appendChild(s);
}

// ── Hamburger icon (inline SVG) ───────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Default link renderer ─────────────────────────────────────────────────────

function defaultRenderLink(
  item: MosaicNavItem,
  children: React.ReactNode,
  className: string,
  onClick?: () => void,
) {
  return (
    <a key={item.href} href={item.href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicMainNav({
  items = [],
  activePath,
  isAdmin = false,
  renderLink,
  drawerTitle = "Navigation",
  drawerSubtitle = "Access all features",
  openMenuAriaLabel,
  closeMenuAriaLabel,
  drawerNavAriaLabel,
  mainNavAriaLabel,
  adminBadgeLabel,
  className,
}: MosaicMainNavProps) {
  const { isMobile } = useDevice();
  const [isOpen, setIsOpen] = React.useState(false);
  const linkRenderer = renderLink ?? defaultRenderLink;

  React.useEffect(() => {
    injectStyles();
  }, []);

  // Close on escape
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const filteredItems = items.filter((item) => !item.adminOnly || isAdmin);

  const isItemActive = (item: MosaicNavItem) =>
    item.isActive ?? (activePath !== undefined && item.href === activePath);

  if (isMobile) {
    return (
      <div data-slot="main-nav" className={className}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-0",
            "text-foreground hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={openMenuAriaLabel}
          aria-expanded={isOpen}
        >
          <HamburgerIcon />
        </button>

        {/* Backdrop */}
        {isOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label={closeMenuAriaLabel}
            tabIndex={-1}
          />
        )}

        {/* Drawer */}
        <dialog
          aria-label={drawerNavAriaLabel}
          open={isOpen}
          data-open={isOpen ? "true" : "false"}
          className={cn(
            "mosaic-nav-drawer",
            "fixed inset-y-0 left-0 z-50 m-0 w-[280px] max-h-none h-full p-0",
            "border-r border-border bg-background shadow-xl",
            !isOpen && "hidden",
          )}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <p className="font-semibold">{drawerTitle}</p>
              <p className="text-sm text-muted-foreground">{drawerSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label={closeMenuAriaLabel}
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label={mainNavAriaLabel}>
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              const itemClass = cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "min-h-[44px]",
                active && "bg-accent text-accent-foreground",
              );
              return (
                <React.Fragment key={item.href}>
                  {linkRenderer(
                    item,
                    <>
                      {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
                      <span>{item.label}</span>
                      {item.adminOnly && (
                        <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {adminBadgeLabel}
                        </span>
                      )}
                    </>,
                    itemClass,
                    () => setIsOpen(false),
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </dialog>
      </div>
    );
  }

  return (
    <nav
      data-slot="main-nav"
      className={cn("flex items-center gap-1", className)}
      aria-label={mainNavAriaLabel}
    >
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item);
        const itemClass = cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "bg-accent text-accent-foreground",
        );
        return (
          <React.Fragment key={item.href}>
            {linkRenderer(
              item,
              <>
                {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {adminBadgeLabel}
                  </span>
                )}
              </>,
              itemClass,
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

MosaicMainNav.displayName = "MosaicMainNav";
