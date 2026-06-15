/**
 * MosaicStatsGrid — statistics grid section
 *
 * Ported from heyfabrika/styleui components/templates/axis/stats.tsx (MIT).
 * Adapted: props-driven stats array (label + value as strings — no animated counter
 * dependency for portability; consumers may wrap value in their own counter component).
 * Grid layout: border-grid pattern for visual rhythm.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatItem {
  /** Stat numeric or string value, e.g. "10K+" or "99.9%" */
  value: string;
  /** Human-readable label, e.g. "Active users" */
  label: string;
}

export interface MosaicStatsGridProps {
  /** Array of stats to display */
  stats: StatItem[];
  /** Optional section heading */
  heading?: React.ReactNode;
  /** Optional section subtext */
  subtext?: React.ReactNode;
  className?: string;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicStatsGrid — border-grid layout for 2–6 stats. Values are plain strings;
 * wrap in an animated counter component at the consumer level if needed.
 *
 * @example
 * <MosaicStatsGrid
 *   heading="Trusted by thousands"
 *   stats={[
 *     { value: "10K+", label: "Active users" },
 *     { value: "99.9%", label: "Uptime" },
 *     { value: "50+", label: "Countries" },
 *   ]}
 * />
 */
export const MosaicStatsGrid = React.forwardRef<HTMLElement, MosaicStatsGridProps>(
  function MosaicStatsGrid({ stats, heading, subtext, className }, ref) {
    return (
      <section ref={ref} className={cn("w-full py-16", className)}>
        {(heading ?? subtext) && (
          <div className="mb-16 flex flex-col items-center gap-3 px-4 text-center">
            {heading && (
              <h2 className="text-3xl font-medium tracking-tight text-[oklch(0.12_0.01_250)] sm:text-4xl">
                {heading}
              </h2>
            )}
            {subtext && (
              <p className="max-w-md text-sm text-[oklch(0.5_0.01_250)] sm:text-base">{subtext}</p>
            )}
          </div>
        )}

        <div className="mx-auto max-w-5xl px-4">
          <div
            className="grid grid-cols-1 border-l border-t border-[oklch(0.9_0.005_250)]"
            style={{
              gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center border-b border-r border-[oklch(0.9_0.005_250)] py-12 px-6 text-center"
              >
                <span className="text-3xl font-semibold tracking-tight text-[oklch(0.12_0.01_250)] md:text-4xl tabular-nums">
                  {stat.value}
                </span>
                <p className="mt-2 text-sm text-[oklch(0.5_0.01_250)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
);

MosaicStatsGrid.displayName = "MosaicStatsGrid";
