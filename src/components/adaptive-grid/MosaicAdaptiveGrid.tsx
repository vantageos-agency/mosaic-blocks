"use client";

/**
 * MosaicAdaptiveGrid — device-aware CSS grid wrapper (PC-02)
 *
 * Ported (source: private upstream) components/adaptive/AdaptiveGrid.tsx
 *
 * Reads isMobile/isTablet/isDesktop from useDevice() and applies the correct
 * column count via inline CSS variables (avoids Tailwind JIT dynamic class issues).
 * Zero debate coupling. Fully generic.
 *
 * Framer-motion: N/A (layout-only).
 */

import type * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAdaptiveGridProps {
  children: React.ReactNode;
  /** Grid columns on mobile (default 1) */
  mobileColumns?: number;
  /** Grid columns on tablet (default 2) */
  tabletColumns?: number;
  /** Grid columns on desktop (default 3) */
  desktopColumns?: number;
  /** Gap between cells (Tailwind gap class, default "gap-4") */
  gap?: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAdaptiveGrid — responsive grid that switches column count based on
 * the device breakpoint provided by MosaicDeviceProvider.
 *
 * @example
 * <MosaicDeviceProvider>
 *   <MosaicAdaptiveGrid mobileColumns={1} tabletColumns={2} desktopColumns={3}>
 *     <Card />
 *     <Card />
 *     <Card />
 *   </MosaicAdaptiveGrid>
 * </MosaicDeviceProvider>
 */
export function MosaicAdaptiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = "gap-4",
  className,
  ref,
}: MosaicAdaptiveGridProps) {
  const { isMobile, isTablet } = useDevice();

  const cols = isMobile ? mobileColumns : isTablet ? tabletColumns : desktopColumns;

  return (
    <div
      ref={ref}
      data-slot="adaptive-grid"
      className={cn("grid", gap, className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

MosaicAdaptiveGrid.displayName = "MosaicAdaptiveGrid";
