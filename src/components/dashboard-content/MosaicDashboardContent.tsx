"use client";

/**
 * MosaicDashboardContent — generic dashboard content area with view switcher
 *
 * Ported from components/dashboard/DashboardContent.tsx
 *
 * Features:
 * - Tab-based view switcher (currentView → renders matching content slot)
 * - Responsive padding (mobile vs desktop)
 * - Slot-based content: consumers pass views[] with id + content
 *
 * framer-motion replaced with CSS keyframe fade-in.
 * All debate-specific sub-components (SessionList, AgentLibrary) stripped.
 * Content is purely prop-driven via views[].
 */

import * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-dashboard-content-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-content-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mosaic-content-view {
      animation: mosaic-content-in 220ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-content-view { animation: none !important; }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicDashboardView {
  id: string;
  label?: string;
  content: React.ReactNode;
}

export interface MosaicDashboardContentProps {
  /** Available views */
  views: MosaicDashboardView[];
  /** Currently active view id */
  currentView: string;
  /**
   * Label shown when `currentView` matches no entry in `views`. Rendered to
   * the end user — required host-owned string, no default. The component
   * appends `currentView` after it (a data value, not library-owned prose).
   */
  viewNotFoundLabel: string;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicDashboardContent({
  views,
  currentView,
  viewNotFoundLabel,
  className,
}: MosaicDashboardContentProps) {
  const { isMobile } = useDevice();

  React.useEffect(() => {
    injectStyles();
  }, []);

  const activeView = views.find((v) => v.id === currentView);

  return (
    <div
      data-slot="dashboard-content"
      className={cn("h-full overflow-auto", isMobile ? "p-4" : "p-6", className)}
    >
      {activeView ? (
        <div key={currentView} className="mosaic-content-view space-y-6">
          {activeView.content}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {viewNotFoundLabel}
          {currentView}
        </p>
      )}
    </div>
  );
}

MosaicDashboardContent.displayName = "MosaicDashboardContent";
