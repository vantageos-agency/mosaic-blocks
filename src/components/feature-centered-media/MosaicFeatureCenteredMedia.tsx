/**
 * MosaicFeatureCenteredMedia — centered feature section with media
 *
 * Ported from heyfabrika/styleui components/templates/axis/feature.tsx (MIT).
 * Adapted: props-driven features list + media slot. No hardcoded copy.
 * Layout: text header centered, media centered below.
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
}

export interface MosaicFeatureCenteredMediaProps {
  /** Section heading */
  title: React.ReactNode;
  /** Section subtext / body */
  body: React.ReactNode;
  /** Optional feature list — rendered in a grid below the heading */
  features?: FeatureItem[];
  /** Media slot — centered below or beside the text */
  media?: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicFeatureCenteredMedia — centered heading + body, optional feature grid,
 * centered media below. Media slot accepts any React node.
 *
 * @example
 * <MosaicFeatureCenteredMedia
 *   title="Everything you need"
 *   body="Built for teams that move fast."
 *   features={[{ id: "f1", title: "Fast", description: "Deploy in seconds." }]}
 *   media={<img src="/feature.png" alt="Feature screenshot" className="w-full rounded-2xl" />}
 * />
 */
export function MosaicFeatureCenteredMedia({
  title,
  body,
  features,
  media,
  className,
  ref,
}: MosaicFeatureCenteredMediaProps) {
  return (
    <section ref={ref} className={cn("relative mx-auto w-full max-w-6xl px-4 py-16", className)}>
      {/* Header */}
      <div className="mb-12 text-center lg:mb-16">
        <h2 className="text-3xl font-medium tracking-tight text-[oklch(0.12_0.01_250)] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-sm text-[oklch(0.5_0.01_250)] sm:text-base max-w-xl mx-auto">
          {body}
        </p>
      </div>

      {/* Feature grid (optional) */}
      {features && features.length > 0 && (
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.id} className="flex flex-col gap-2">
              <h3 className="text-base font-medium text-[oklch(0.12_0.01_250)]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[oklch(0.5_0.01_250)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Media slot */}
      {media && (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">{media}</div>
        </div>
      )}
    </section>
  );
}

MosaicFeatureCenteredMedia.displayName = "MosaicFeatureCenteredMedia";
