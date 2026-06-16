/**
 * MosaicLogosGrid — logo cloud / partner logos grid
 *
 * Ported from heyfabrika/styleui blocks/logo-cloud.tsx (MIT).
 * Adapted: fully props-driven logos array (name, src, width, height).
 * No next/image dependency (lib-portable), uses native <img> with role.
 * No motion/react dependency — CSS opacity transition only.
 *
 * T4 addition: opt-in `stagger` prop for staggered reveal animation.
 * Same keyframe approach as MosaicAnimatedList. Respects prefers-reduced-motion.
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
  /**
   * Opt-in staggered reveal animation.
   * - `true` → default step of 80ms between items
   * - `number` → explicit ms step between items
   * - `false` / `undefined` → no animation (default, fully backward-compatible)
   * Respects prefers-reduced-motion: no delay applied when reduced motion is set.
   */
  stagger?: boolean | number;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe style injection ──────────────────────────────────────────────────

const ANIMATION_ID = "mosaic-logos-grid-kf";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIMATION_ID)) return;
  const style = document.createElement("style");
  style.id = ANIMATION_ID;
  style.textContent = `
    @keyframes mosaic-logo-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-logo-stagger { animation: none !important; opacity: 0.7 !important; transform: none !important; }
    }
  `;
  document.head.appendChild(style);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicLogosGrid — wrapping flex grid of partner/integration logos.
 * Pass `heading` for a "Trusted by" label above the logos.
 * Pass `stagger` (true or ms number) for a staggered reveal animation.
 *
 * @example
 * <MosaicLogosGrid
 *   heading="Trusted by leading teams"
 *   logos={[
 *     { name: "Notion", src: "/logos/notion.svg", width: 100, height: 40 },
 *     { name: "Slack", src: "/logos/slack.svg", width: 80, height: 80 },
 *   ]}
 *   stagger={80}
 * />
 */
export function MosaicLogosGrid({ logos, heading, stagger, className, ref }: MosaicLogosGridProps) {
  const isStagger = stagger !== undefined && stagger !== false;
  const stepMs = typeof stagger === "number" ? stagger : 80;

  React.useEffect(() => {
    if (isStagger) injectKeyframes();
  }, [isStagger]);

  const reducedMotion = prefersReducedMotion();

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
        {logos.map((logo, i) => {
          return (
            <div
              key={logo.name}
              data-slot="logos-grid-item"
              className={cn(
                "transition-transform duration-200 hover:scale-110",
                isStagger && !reducedMotion && "mosaic-logo-stagger",
              )}
              style={
                isStagger && !reducedMotion
                  ? {
                      opacity: 0,
                      animation: `mosaic-logo-in 400ms ease-out ${i * stepMs}ms forwards`,
                      animationDelay: `${i * stepMs}ms`,
                    }
                  : {}
              }
            >
              {/* Native img — lib-portable; consumers using Next.js should wrap with next/image */}
              <img
                src={logo.src}
                alt={logo.name}
                width={logo.width ?? 80}
                height={logo.height ?? 80}
                className="object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-200"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

MosaicLogosGrid.displayName = "MosaicLogosGrid";
