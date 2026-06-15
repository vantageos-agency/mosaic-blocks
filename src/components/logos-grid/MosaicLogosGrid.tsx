/**
 * MosaicLogosGrid — logo cloud / partner logos grid
 *
 * Ported from heyfabrika/styleui blocks/logo-cloud.tsx (MIT).
 * Adapted: fully props-driven logos array (name, src, width, height).
 * No next/image dependency (lib-portable), uses native <img> with role.
 * No motion/react dependency — CSS opacity transition only.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LogoItem {
  /** Alt text / brand name */
  name: string;
  /** Image src URL */
  src: string;
  /** Optional explicit width (defaults to 80) */
  width?: number;
  /** Optional explicit height (defaults to 80) */
  height?: number;
}

export interface MosaicLogosGridProps {
  /** Array of logos to display */
  logos: LogoItem[];
  /** Optional heading text above the grid */
  heading?: React.ReactNode;
  className?: string;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicLogosGrid — wrapping flex grid of partner/integration logos.
 * Pass `heading` for a "Trusted by" label above the logos.
 *
 * @example
 * <MosaicLogosGrid
 *   heading="Trusted by leading teams"
 *   logos={[
 *     { name: "Notion", src: "/logos/notion.svg", width: 100, height: 40 },
 *     { name: "Slack", src: "/logos/slack.svg", width: 80, height: 80 },
 *   ]}
 * />
 */
export const MosaicLogosGrid = React.forwardRef<HTMLElement, MosaicLogosGridProps>(
  function MosaicLogosGrid({ logos, heading, className }, ref) {
    return (
      <section
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-8 px-4 py-12 mx-auto max-w-6xl",
          className,
        )}
      >
        {heading && (
          <p className="text-center text-sm font-light text-[oklch(0.5_0.01_250)]">{heading}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-12">
          {logos.map((logo) => (
            <div key={logo.name} className="transition-transform duration-200 hover:scale-110">
              {/* Native img — lib-portable; consumers using Next.js should wrap with next/image */}
              <img
                src={logo.src}
                alt={logo.name}
                width={logo.width ?? 80}
                height={logo.height ?? 80}
                className="object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-200"
              />
            </div>
          ))}
        </div>
      </section>
    );
  },
);

MosaicLogosGrid.displayName = "MosaicLogosGrid";
