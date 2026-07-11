"use client";

/**
 * MosaicDashboardLayout — full app shell (PC-05)
 *
 * Ported (source: private upstream) components/dashboard/DashboardLayout.tsx
 *
 * Features:
 * - Sticky header with title, subtitle, optional breadcrumbs, actions slot
 * - Desktop: persistent sidebar (MosaicAppSidebar)
 * - Mobile: hamburger button → AdaptiveModal drawer containing sidebar
 * - headerActions slot: replaces debate-specific OrgSwitcher/TokenBalance/QuickActionsMenu
 * - Fully props-driven, zero hardcoded branding
 *
 * Framer-motion (header animation) replaced with CSS keyframe.
 * Breadcrumb: rendered with semantic <nav>/<ol> (no Radix dep).
 * next/link removed — breadcrumbs use <a> by default; renderLink prop for router consumers.
 * ScrollArea Radix removed — native overflow-auto.
 * Respects prefers-reduced-motion.
 */

import * as React from "react";
import { MosaicAdaptiveModal } from "../adaptive-modal/MosaicAdaptiveModal.js";
import { MosaicAppSidebar } from "../app-sidebar/MosaicAppSidebar.js";
import type { MosaicAppSidebarProps } from "../app-sidebar/MosaicAppSidebar.js";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-dashboard-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-header-in {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mosaic-dashboard-header {
      animation: mosaic-header-in 200ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-dashboard-header {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicBreadcrumb {
  label: string;
  href?: string;
}

export interface MosaicDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: MosaicBreadcrumb[];
  /** Slot for header-right actions (theme toggle, avatar, etc.) */
  actions?: React.ReactNode;
  /**
   * Props forwarded to MosaicAppSidebar (navItems, quickActions, etc.).
   * Required — MosaicAppSidebar itself requires host-owned aria-label /
   * heading strings with no default.
   */
  sidebarProps: Omit<MosaicAppSidebarProps, "isCollapsed" | "onToggleCollapse">;
  /** Whether sidebar starts collapsed (default false) */
  defaultSidebarCollapsed?: boolean;
  /** Mobile sidebar modal title. Required, no default. */
  mobileSidebarTitle: string;
  /**
   * Custom link renderer for breadcrumbs (e.g. Next.js Link).
   * Default: native <a>.
   */
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode;
  /**
   * Required host-owned strings — no default, no fallback. The host owns
   * the language (e.g. next-intl `t()`).
   */
  headerAriaLabel: string;
  openNavigationAriaLabel: string;
  breadcrumbAriaLabel: string;
  mobileSidebarCloseAriaLabel: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicDashboardLayout — full-height app shell with persistent sidebar (desktop)
 * and drawer sidebar (mobile). All content via props/children.
 *
 * @example
 * <MosaicDeviceProvider>
 *   <MosaicDashboardLayout
 *     title="Dashboard"
 *     subtitle="Overview"
 *     breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
 *     actions={<ThemeToggle />}
 *     sidebarProps={{
 *       navItems: [...],
 *       logoSlot: <img src="/logo.svg" alt="Brand" />,
 *     }}
 *   >
 *     <DashboardContent />
 *   </MosaicDashboardLayout>
 * </MosaicDeviceProvider>
 */
export function MosaicDashboardLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  sidebarProps,
  defaultSidebarCollapsed = false,
  mobileSidebarTitle,
  renderLink,
  headerAriaLabel,
  openNavigationAriaLabel,
  breadcrumbAriaLabel,
  mobileSidebarCloseAriaLabel,
  className,
  ref,
}: MosaicDashboardLayoutProps) {
  const { isMobile } = useDevice();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(defaultSidebarCollapsed);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    injectStyles();
  }, []);

  const defaultRenderLink = (href: string, children: React.ReactNode) => (
    <a href={href} className="transition-colors hover:text-foreground">
      {children}
    </a>
  );

  const link = renderLink ?? defaultRenderLink;

  return (
    <div
      ref={ref}
      data-slot="dashboard-layout"
      className={cn("flex h-screen w-full bg-background", className)}
    >
      {/* Desktop sidebar */}
      {!isMobile && (
        <MosaicAppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
          {...sidebarProps}
        />
      )}

      {/* Main content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header */}
        <header
          className="mosaic-dashboard-header sticky top-0 z-40 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm"
          aria-label={headerAriaLabel}
        >
          <div className="flex items-center justify-between gap-4 p-3 md:p-4">
            {/* Left: mobile hamburger + title + breadcrumbs */}
            <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
              {isMobile && (
                <button
                  type="button"
                  aria-label={openNavigationAriaLabel}
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    "text-foreground transition-colors hover:bg-muted",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <MenuIcon />
                </button>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
                {subtitle && (
                  <p className="hidden truncate text-xs text-muted-foreground md:block md:text-sm">
                    {subtitle}
                  </p>
                )}

                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav aria-label={breadcrumbAriaLabel} className="mt-0.5 hidden md:block">
                    <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                          <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
                            {isLast ? (
                              <span aria-current="page" className="font-medium text-foreground">
                                {crumb.label}
                              </span>
                            ) : (
                              <>
                                {crumb.href ? (
                                  link(crumb.href, crumb.label)
                                ) : (
                                  <span>{crumb.label}</span>
                                )}
                                <ChevronRightIcon />
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                )}
              </div>
            </div>

            {/* Right: actions slot */}
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </div>
      </div>

      {/* Mobile sidebar modal */}
      {isMobile && (
        <MosaicAdaptiveModal
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          title={mobileSidebarTitle}
          closeAriaLabel={mobileSidebarCloseAriaLabel}
        >
          <MosaicAppSidebar
            isCollapsed={false}
            onToggleCollapse={() => {}}
            onNavigate={(href) => {
              setIsMobileSidebarOpen(false);
              sidebarProps?.onNavigate?.(href);
            }}
            {...sidebarProps}
          />
        </MosaicAdaptiveModal>
      )}
    </div>
  );
}

MosaicDashboardLayout.displayName = "MosaicDashboardLayout";
