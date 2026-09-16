"use client";

/**
 * MosaicKpiTile — finished, elevated KPI stat tile (Wave-1 T5, BLOCK 2)
 *
 * Fixes the operator verdict on the HeroUI trials ("flat, a mockup, no
 * relief, no animation") for the stat-tile class specifically: previously a
 * bordered box (MosaicStatsGrid), now a raised card that consumes the T1
 * relief + motion theme data (`src/theme/depth.css`, docs/adr/0002) —
 * elevation + highlight edge, entry animation, hover-lift, all token-driven
 * and zeroed under `prefers-reduced-motion` by depth.css itself.
 *
 * Every color/shadow/duration reference is a CSS custom property or a
 * semantic Tailwind utility (bg-success-500/bg-danger-500/bg-accent) — never
 * a literal. See docs/adr/0002-heroui-v3-finished-blocks.md for the token
 * mapping this file consumes.
 *
 * i18n: zero hardcoded user-facing strings. `label`, `trend.label`, and
 * `notConnectedLabel` are caller-owned — a French and an English consumer
 * both render the identical component with different prop values (see
 * MosaicKpiTile.stories.tsx NotConnectedFr / NotConnectedEn).
 *
 * data-slot="kpi-tile" on the root, per docs/ARCHITECTURE.md § data-slot
 * convention.
 */

import type * as React from "react";
import { MosaicSkeleton } from "../skeleton/MosaicSkeleton.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicKpiTileTrend {
  direction: "up" | "down";
  /** Caller-formatted trend text, e.g. "+12%" / "-4%" — never computed here. */
  label: string;
}

interface MosaicKpiTileBaseProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: MosaicKpiTileTrend;
  /** Raw series for the inline SVG sparkline (no charting dependency). */
  sparklineData?: number[];
  /** Loading takes priority over connected/not-connected. */
  isLoading?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * notConnectedLabel is REQUIRED exactly where it is READ: only the
 * isConnected===false branch renders it, so the type only requires it
 * there — never a silently-missing default (mirrors MosaicAppSidebarProps
 * bottomNavAriaLabel pattern).
 */
export type MosaicKpiTileProps = MosaicKpiTileBaseProps &
  ({ isConnected?: true } | { isConnected: false; notConnectedLabel: string });

// ── Sparkline (pure inline SVG, no recharts dependency) ─────────────────────

function Sparkline({ data }: { data: number[] }) {
  const width = 100;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      data-slot="kpi-tile-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Trend arrow icons ─────────────────────────────────────────────────────────

function TrendUpIcon() {
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

function TrendDownIcon() {
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
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicKpiTile — elevated stat card: icon well, trend badge, sparkline,
 * loading skeleton, and a caller-labeled "not connected" state.
 *
 * @example
 * <MosaicKpiTile
 *   label="Baux actifs"
 *   value="127"
 *   icon={<BuildingIcon />}
 *   trend={{ direction: "up", label: "+12%" }}
 *   sparklineData={[98, 101, 104, 99, 107, 112]}
 * />
 */
export function MosaicKpiTile(props: MosaicKpiTileProps) {
  const { label, value, icon, trend, sparklineData, isLoading, className, ref } = props;

  const trendColorClass =
    trend?.direction === "up"
      ? "text-success-500"
      : trend?.direction === "down"
        ? "text-danger-500"
        : "text-muted-foreground";

  return (
    <div
      ref={ref}
      data-slot="kpi-tile"
      className={cn(
        "mosaic-motion-entry mosaic-motion-hover-lift relative flex flex-col gap-3 rounded-xl p-5",
        className,
      )}
      style={{
        background: "var(--mosaic-surface-card)",
        boxShadow: "var(--mosaic-elevation-1-highlight), var(--mosaic-elevation-1-shadow)",
      }}
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <MosaicSkeleton variant="circle" className="size-9" />
            <MosaicSkeleton variant="text" className="w-10" />
          </div>
          <MosaicSkeleton variant="text" className="w-2/3" />
          <MosaicSkeleton variant="text" className="w-1/3 h-7" />
        </div>
      ) : props.isConnected === false ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-2 py-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-sm text-muted-foreground/80">{props.notConnectedLabel}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            {icon && (
              <div
                data-slot="kpi-tile-icon-well"
                className="flex size-9 items-center justify-center rounded-lg text-foreground"
                style={{ background: "var(--mosaic-surface-well)" }}
              >
                {icon}
              </div>
            )}
            {trend && (
              <div
                data-slot="kpi-tile-trend"
                data-trend={trend.direction}
                className={cn("flex items-center gap-1 text-xs font-semibold", trendColorClass)}
              >
                {trend.direction === "up" ? <TrendUpIcon /> : <TrendDownIcon />}
                <span>{trend.label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div className={trendColorClass}>
              <Sparkline data={sparklineData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

MosaicKpiTile.displayName = "MosaicKpiTile";
