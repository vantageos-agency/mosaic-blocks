"use client";

/**
 * MosaicDashboardHeader — generic sticky dashboard header
 *
 * Ported from components/dashboard/DashboardHeader.tsx
 *
 * Features:
 * - Sticky backdrop-blur header
 * - Title + subtitle
 * - Desktop: inline search bar
 * - Mobile: compact search icon button
 * - Notification bell with count badge
 * - Right-side actions slot (theme toggle, avatar, etc.)
 *
 * framer-motion (header entrance + spinning sparkle) replaced with CSS.
 * next/link removed — links are callbacks.
 * All debate-specific actions stripped.
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-dashboard-header2-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-header2-in {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mosaic-dashboard-header2 {
      animation: mosaic-header2-in 200ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-dashboard-header2 { animation: none !important; }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicDashboardHeaderProps {
  title?: string;
  subtitle?: string;
  /** Notification count (0 = no badge) */
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onSearchChange?: (query: string) => void;
  /** Right-side slot (theme toggle, avatar, quick actions, etc.) */
  actions?: React.ReactNode;
  /** Logo/brand slot (left of title) */
  logoSlot?: React.ReactNode;
  /**
   * Placeholder for the desktop search input. Required — the host owns
   * the language (e.g. `t('DashboardHeader.searchPlaceholder')`). No default.
   */
  searchPlaceholder: string;
  /**
   * aria-label for the mobile search icon button. Required — host-owned,
   * no default.
   */
  searchAriaLabel: string;
  className?: string;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function BellIcon() {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-primary"
    >
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M5 20l.5-1.5L7 18l-1.5-.5L5 16l-.5 1.5L3 18l1.5.5z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicDashboardHeader({
  title = "Dashboard",
  subtitle,
  notificationCount = 0,
  onNotificationsClick,
  onSearchChange,
  actions,
  logoSlot,
  searchPlaceholder,
  searchAriaLabel,
  className,
}: MosaicDashboardHeaderProps) {
  const { isMobile } = useDevice();
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    injectStyles();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange?.(e.target.value);
  };

  return (
    <header
      data-slot="dashboard-header"
      className={cn(
        "mosaic-dashboard-header2",
        "sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className={cn(isMobile ? "px-4 py-3" : "container mx-auto px-4 py-4")}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: logo + title */}
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              {logoSlot ?? <SparklesIcon />}
              <div className="min-w-0">
                <h1 className={cn("font-semibold truncate", isMobile ? "text-lg" : "text-xl")}>
                  {title}
                </h1>
                {subtitle && !isMobile && (
                  <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Center: search (desktop only) */}
          {!isMobile && onSearchChange && (
            <div className="mx-8 max-w-md flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full rounded-md border border-input bg-background py-2 pl-9 pr-3",
                    "text-sm placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
              </div>
            </div>
          )}

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            {/* Mobile search button */}
            {isMobile && onSearchChange && (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={searchAriaLabel}
                onClick={() => {
                  // Consumers can intercept via onSearchChange
                }}
              >
                <SearchIcon />
              </button>
            )}

            {/* Notifications */}
            {onNotificationsClick && (
              <button
                type="button"
                onClick={onNotificationsClick}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount})` : ""}`}
              >
                <BellIcon />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
            )}

            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}

MosaicDashboardHeader.displayName = "MosaicDashboardHeader";
