/**
 * MosaicHeroSplit — split hero section
 *
 * Ported from heyfabrika/styleui components/templates/axis/hero.tsx (MIT).
 * Adapted: fully props-driven, no hardcoded copy/images/branding.
 * Motion: CSS fade-up via Tailwind animate utilities (@keyframes in globals).
 * Media slot: accepts any React node (image, illustration, video, etc.).
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeroCta {
  label: string;
  href: string;
}

export interface MosaicHeroSplitProps {
  /** Small badge text above the title */
  eyebrow?: string;
  /** Main heading — the primary message */
  title: React.ReactNode;
  /** Supporting paragraph */
  subtitle: React.ReactNode;
  /** Primary CTA */
  cta?: HeroCta;
  /** Secondary CTA */
  ctaSecondary?: HeroCta;
  /** Right-column media slot — accepts img, video, SVG, or any node */
  media?: React.ReactNode;
  className?: string;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicHeroSplit — two-column hero: copy on left, media on right.
 * Falls back to centered single-column when no media provided.
 *
 * @example
 * <MosaicHeroSplit
 *   eyebrow="New"
 *   title="The platform built for modern teams"
 *   subtitle="Ship faster, collaborate smarter."
 *   cta={{ label: "Start free", href: "/signup" }}
 *   media={<img src="/hero.png" alt="Product screenshot" className="w-full rounded-2xl" />}
 * />
 */
export const MosaicHeroSplit = React.forwardRef<HTMLElement, MosaicHeroSplitProps>(
  function MosaicHeroSplit({ eyebrow, title, subtitle, cta, ctaSecondary, media, className }, ref) {
    return (
      <section
        ref={ref}
        className={cn(
          "flex flex-col gap-16 items-center justify-center py-8 lg:pt-16 px-4",
          className,
        )}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-8 max-w-6xl mx-auto">
          {/* Copy */}
          <div className="flex flex-col gap-6 lg:max-w-xl">
            {eyebrow && (
              <span className="inline-flex w-fit items-center rounded-full border border-[oklch(0.85_0.01_250)] bg-[oklch(0.97_0.005_250)] px-3 py-1 text-xs font-semibold tracking-wide text-[oklch(0.4_0.02_250)] uppercase">
                {eyebrow}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-center lg:text-left text-[oklch(0.12_0.01_250)]">
              {title}
            </h1>
            <p className="text-base md:text-lg text-center lg:text-left text-[oklch(0.45_0.01_250)] leading-relaxed">
              {subtitle}
            </p>
            {(cta ?? ctaSecondary) && (
              <div className="flex flex-row flex-wrap gap-3 justify-center lg:justify-start">
                {cta && (
                  <a
                    href={cta.href}
                    className="inline-flex items-center justify-center rounded-full bg-[oklch(0.15_0.01_250)] px-6 py-2.5 text-sm font-medium text-[oklch(0.98_0_0)] transition-colors hover:bg-[oklch(0.25_0.01_250)]"
                  >
                    {cta.label}
                  </a>
                )}
                {ctaSecondary && (
                  <a
                    href={ctaSecondary.href}
                    className="inline-flex items-center justify-center rounded-full border border-[oklch(0.75_0.01_250)] bg-transparent px-6 py-2.5 text-sm font-medium text-[oklch(0.15_0.01_250)] transition-colors hover:bg-[oklch(0.96_0.005_250)]"
                  >
                    {ctaSecondary.label}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Media slot */}
          {media && <div className="w-full lg:max-w-lg xl:max-w-2xl flex-shrink-0">{media}</div>}
        </div>
      </section>
    );
  },
);

MosaicHeroSplit.displayName = "MosaicHeroSplit";
