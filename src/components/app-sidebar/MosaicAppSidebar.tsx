"use client";

/**
 * MosaicAppSidebar — collapsible nav sidebar + mobile drawer (PC-06)
 *
 * Ported (source: private upstream) components/dashboard/DashboardSidebar.tsx
 *
 * Features:
 * - Collapsible: 64px icon-only / 280–320px expanded
 * - Submenu support (nested nav items)
 * - Quick Actions section (pluggable via props)
 * - Recent Activity section (pluggable via props)
 * - Footer status slot
 * - Mobile: renders full-width when inside AdaptiveModal drawer
 *
 * Generalized: ALL hardcoded debate nav items, hrefs, branding stripped.
 * Now fully props-driven via navItems[], quickActions[], recentItems[], logoSlot.
 * Removed: next/navigation (usePathname, useRouter) → replaced with activePath prop +
 *   onNavigate callback so consumers can wire their router.
 * Removed: ScrollArea radix dep → native overflow-y-auto with custom scrollbar.
 *
 * Framer-motion fully replaced with CSS transitions + keyframes.
 * Icons: inline SVG (no lucide dep) for structural icons; nav icons are caller-provided.
 * Respects prefers-reduced-motion.
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframes ─────────────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-sidebar-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-sidebar-fade-in {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes mosaic-submenu-in {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 400px; }
    }
    .mosaic-sidebar-label-in {
      animation: mosaic-sidebar-fade-in 200ms ease-out forwards;
    }
    .mosaic-sidebar-submenu {
      overflow: hidden;
      animation: mosaic-submenu-in 200ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-sidebar-label-in,
      .mosaic-sidebar-submenu {
        animation: none !important;
        opacity: 1 !important;
        max-height: 9999px !important;
        transform: none !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicSidebarNavItem {
  /** Stable unique ID */
  id: string;
  label: string;
  href: string;
  /** Icon ReactNode (any SVG/component) */
  icon?: React.ReactNode;
  /** Badge label (e.g. count or "New") */
  badge?: string;
  /** Nested submenu items */
  submenu?: Array<{ id: string; label: string; href: string; icon?: React.ReactNode }>;
}

export interface MosaicSidebarQuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface MosaicSidebarRecentItem {
  id: string;
  title: string;
  time: string;
  count?: number;
}

export interface MosaicSidebarFooterStatus {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface MosaicAppSidebarBaseProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** Current active path — used to highlight active nav items */
  activePath?: string;
  /** Called when a nav item is clicked (use to close mobile drawer, push router, etc.) */
  onNavigate?: (href: string) => void;
  /** Navigation items (main nav) */
  navItems?: MosaicSidebarNavItem[];
  /** Quick action buttons */
  quickActions?: MosaicSidebarQuickAction[];
  /** Recent activity items */
  recentItems?: MosaicSidebarRecentItem[];
  /** Logo / brand slot (shown in header when expanded) */
  logoSlot?: React.ReactNode;
  /** Footer status pill */
  footerStatus?: MosaicSidebarFooterStatus;
  /**
   * Position of the collapse/expand chevron toggle. Defaults to "top" (inside
   * the header) — the pre-existing behavior, unchanged for current consumers.
   * "bottom" anchors it in its own zone below the nav (and below bottomNavItems
   * when present), matching a footer-anchored nav pattern.
   */
  chevronPosition?: "top" | "bottom";
  /**
   * aria-label for the root `<div>` sidebar landmark. Required — host-owned,
   * no default.
   */
  sidebarAriaLabel: string;
  /** aria-label for the main `<nav>`. Required — host-owned, no default. */
  mainNavAriaLabel: string;
  /** Heading above the quick-actions section. Required — host-owned, no default. */
  quickActionsHeading: string;
  /** Heading above the recent-items section. Required — host-owned, no default. */
  recentHeading: string;
  /** aria-label for the collapse-toggle button when expanded. Required, no default. */
  collapseSidebarAriaLabel: string;
  /** aria-label for the collapse-toggle button when collapsed. Required, no default. */
  expandSidebarAriaLabel: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * bottomNavAriaLabel is REQUIRED exactly where it is READ: the bottom nav zone
 * only renders `<nav>` when bottomNavItems is provided, so the label is only
 * required in that branch — never a silently-missing default.
 */
export type MosaicAppSidebarProps = MosaicAppSidebarBaseProps &
  (
    | { bottomNavItems?: undefined; bottomNavAriaLabel?: string }
    | { bottomNavItems: MosaicSidebarNavItem[]; bottomNavAriaLabel: string }
  );

// ── Inline icons ──────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDownIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: rotated ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 200ms ease-out",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrendingUpIcon() {
  return (
    <svg
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAppSidebar — collapsible sidebar with nav, quick actions, recent items, footer.
 * Props-driven: no hardcoded routes or branding. Wires to MosaicDeviceProvider.
 *
 * @example
 * <MosaicDeviceProvider>
 *   <MosaicAppSidebar
 *     isCollapsed={collapsed}
 *     onToggleCollapse={() => setCollapsed(c => !c)}
 *     activePath={router.pathname}
 *     onNavigate={(href) => { router.push(href); }}
 *     navItems={[{ id: "home", label: "Home", href: "/", icon: <HomeIcon /> }]}
 *     logoSlot={<img src="/logo.svg" alt="Brand" className="h-6 w-auto" />}
 *   />
 * </MosaicDeviceProvider>
 */
export function MosaicAppSidebar({
  isCollapsed,
  onToggleCollapse,
  activePath,
  onNavigate,
  navItems = [],
  quickActions = [],
  recentItems = [],
  logoSlot,
  footerStatus,
  chevronPosition = "top",
  bottomNavItems = [],
  bottomNavAriaLabel,
  sidebarAriaLabel,
  mainNavAriaLabel,
  quickActionsHeading,
  recentHeading,
  collapseSidebarAriaLabel,
  expandSidebarAriaLabel,
  className,
  ref,
}: MosaicAppSidebarProps) {
  const { isMobile } = useDevice();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    injectStyles();
  }, []);

  const sidebarWidth = isMobile ? "100%" : isCollapsed ? "64px" : "280px";

  // allow-undeclared-theme-token: success-500 wired to canonical --mosaic-color-success-* (status triads are NOT aliased, #64); resolves via @import "@vantageos/mosaic-tokens/css" at styles.css:4; hand-declaring `var(--success-500)` here would duplicate tokens.css (derive-never-type).
  const footerStatusIconClass = "text-success-500";

  const toggleSubmenu = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNavClick = (href: string) => {
    onNavigate?.(href);
  };

  const collapseToggleButton = !isMobile && (
    <button
      type="button"
      onClick={onToggleCollapse}
      aria-label={isCollapsed ? expandSidebarAriaLabel : collapseSidebarAriaLabel}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        "hover:bg-sidebar-accent text-sidebar-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCollapsed && "mx-auto",
      )}
    >
      {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </button>
  );

  return (
    <div
      ref={ref}
      data-slot="app-sidebar"
      className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border",
        isMobile && "border-r-0",
        className,
      )}
      style={{
        width: sidebarWidth,
        transition: "width 280ms ease-in-out",
        overflow: "hidden",
      }}
      aria-label={sidebarAriaLabel}
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && logoSlot && (
            <div className="mosaic-sidebar-label-in flex items-center gap-2 min-w-0">
              {logoSlot}
            </div>
          )}
          {chevronPosition === "top" && collapseToggleButton}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: "thin" }}>
        {/* Nav items */}
        {navItems.length > 0 && (
          <nav aria-label={mainNavAriaLabel}>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = activePath === item.href;
                const isSubmenuActive = item.submenu?.some((s) => activePath === s.href) ?? false;
                const isExpanded = expandedItems.has(item.id);
                const hasSubmenu = (item.submenu?.length ?? 0) > 0;

                return (
                  <div key={item.id}>
                    {/* Main item */}
                    <button
                      type="button"
                      onClick={() => {
                        if (hasSubmenu && !isCollapsed) {
                          toggleSubmenu(item.id);
                        } else {
                          handleNavClick(item.href);
                        }
                      }}
                      aria-current={isActive ? "page" : undefined}
                      aria-expanded={hasSubmenu && !isCollapsed ? isExpanded : undefined}
                      className={cn(
                        "group flex w-full min-h-[44px] items-center rounded-lg p-3 transition-colors",
                        "hover:bg-sidebar-accent",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        (isActive || isSubmenuActive) && "bg-sidebar-accent",
                        isCollapsed ? "justify-center" : "justify-between",
                      )}
                    >
                      {isCollapsed ? (
                        <span className="text-sidebar-foreground" title={item.label}>
                          {item.icon ?? (
                            <span className="text-xs font-bold">{item.label.charAt(0)}</span>
                          )}
                        </span>
                      ) : (
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <span className="text-sidebar-foreground">{item.icon}</span>
                            )}
                            <span className="mosaic-sidebar-label-in text-sm font-medium text-sidebar-foreground">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.badge && (
                              <span className="rounded-full bg-sidebar-accent/60 px-2 py-0.5 text-xs font-medium text-sidebar-foreground">
                                {item.badge}
                              </span>
                            )}
                            {hasSubmenu && <ChevronDownIcon rotated={isExpanded} />}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Submenu */}
                    {hasSubmenu && !isCollapsed && isExpanded && (
                      <div className="mosaic-sidebar-submenu ml-4 mt-0.5 space-y-0.5">
                        {item.submenu?.map((sub) => {
                          const isSubActive = activePath === sub.href;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleNavClick(sub.href)}
                              aria-current={isSubActive ? "page" : undefined}
                              className={cn(
                                "flex w-full min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                "hover:bg-sidebar-accent/50 text-sidebar-foreground",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isSubActive && "bg-sidebar-accent/70 font-medium",
                              )}
                            >
                              {sub.icon && (
                                <span className="text-sidebar-foreground/80">{sub.icon}</span>
                              )}
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        )}

        {/* Quick Actions */}
        {!isCollapsed && quickActions.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
              {quickActionsHeading}
            </p>
            <div className="space-y-0.5">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    "flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    "text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent items */}
        {!isCollapsed && recentItems.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60">
              {recentHeading}
            </p>
            <div className="space-y-1.5">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="cursor-pointer rounded-lg bg-sidebar-accent/30 p-3 transition-colors hover:bg-sidebar-accent"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {item.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <ClockIcon />
                        <span className="text-xs text-sidebar-foreground/60">{item.time}</span>
                      </div>
                    </div>
                    {item.count !== undefined && (
                      <span className="ml-2 shrink-0 rounded-full bg-sidebar-accent/60 px-2 py-0.5 text-xs text-sidebar-foreground">
                        {item.count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {footerStatus && (
        <div className="shrink-0 border-t border-sidebar-border p-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/30 p-3">
              {footerStatus.icon && (
                <span className={footerStatusIconClass}>{footerStatus.icon}</span>
              )}
              {!footerStatus.icon && <TrendingUpIcon />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground">{footerStatus.label}</p>
                {footerStatus.sublabel && (
                  <p className="text-xs text-sidebar-foreground/60">{footerStatus.sublabel}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent/30 ${footerStatusIconClass}`}
              >
                {footerStatus.icon ?? <TrendingUpIcon />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom-anchored nav (e.g. Settings) — transposed from the reference
           Sidebar's border-t bottom zone, kept separate from footerStatus ── */}
      {bottomNavItems.length > 0 && (
        <div
          data-slot="app-sidebar-bottom-nav"
          className={cn("shrink-0 border-t border-sidebar-border p-2", isCollapsed && "px-2")}
        >
          <nav aria-label={bottomNavAriaLabel}>
            <div className="space-y-0.5">
              {bottomNavItems.map((item) => {
                const isActive = activePath === item.href;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full min-h-[44px] items-center rounded-lg p-3 transition-colors",
                      "hover:bg-sidebar-accent",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive && "bg-sidebar-accent",
                      isCollapsed ? "justify-center" : "justify-start gap-3",
                    )}
                  >
                    {isCollapsed ? (
                      <span className="text-sidebar-foreground" title={item.label}>
                        {item.icon ?? (
                          <span className="text-xs font-bold">{item.label.charAt(0)}</span>
                        )}
                      </span>
                    ) : (
                      <>
                        {item.icon && <span className="text-sidebar-foreground">{item.icon}</span>}
                        <span className="mosaic-sidebar-label-in text-sm font-medium text-sidebar-foreground">
                          {item.label}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* ── Collapse toggle anchored at the bottom of the rail ── */}
      {chevronPosition === "bottom" && collapseToggleButton && (
        <div
          data-slot="app-sidebar-toggle-zone"
          className={cn(
            "shrink-0 border-t border-sidebar-border p-2 flex",
            isCollapsed ? "justify-center" : "justify-end",
          )}
        >
          {collapseToggleButton}
        </div>
      )}
    </div>
  );
}

MosaicAppSidebar.displayName = "MosaicAppSidebar";
