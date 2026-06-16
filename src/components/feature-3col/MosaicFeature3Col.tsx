/**
 * MosaicFeature3Col — 3-column feature grid section
 *
 * Distinct from MosaicFeatureCenteredMedia (single centered layout).
 * Layout: optional header, then a 3-col responsive grid of feature cells.
 * Each cell has an optional icon slot, title, and body.
 * No hardcoded branding. OKLCH semantic classes only.
 * React-19 ref-as-prop (no forwardRef).
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Feature3ColItem {
  /** Stable unique identifier for this feature */
  id: string;
  /** Feature title */
  title: string;
  /** Feature body / description */
  body: string;
  /** Optional icon node rendered above the title */
  icon?: React.ReactNode;
}

export interface MosaicFeature3ColProps {
  /** Optional section heading */
  heading?: string;
  /** Optional section subtext */
  subtext?: string;
  /** Array of feature cells */
  features: Feature3ColItem[];
  className?: string;
  /** Forwarded to the root <section> element (React-19 ref-as-prop) */
  ref?: React.Ref<HTMLElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicFeature3Col — 3-column feature grid with optional heading + subtext.
 * Responsive: 1 column on mobile, 3 at md+.
 *
 * @example
 * <MosaicFeature3Col
 *   heading="Why teams choose us"
 *   subtext="Built for speed and scale."
 *   features={[
 *     { id: "f1", title: "Fast", body: "Deploy in seconds.", icon: <SpeedIcon /> },
 *     { id: "f2", title: "Reliable", body: "99.9% uptime SLA." },
 *     { id: "f3", title: "Secure", body: "Enterprise-grade by default." },
 *   ]}
 * />
 */
export function MosaicFeature3Col({
  heading,
  subtext,
  features,
  className,
  ref,
}: MosaicFeature3ColProps) {
  return (
    <section
      ref={ref}
      data-slot="feature-3col"
      className={cn("mx-auto w-full max-w-6xl px-4 py-16", className)}
    >
      {/* Header */}
      {(heading || subtext) && (
        <div className="mb-12 text-center">
          {heading && (
            <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {heading}
            </h2>
          )}
          {subtext && (
            <p className="mt-4 text-sm text-muted-foreground sm:text-base max-w-xl mx-auto">
              {subtext}
            </p>
          )}
        </div>
      )}

      {/* Feature grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.id} data-slot="feature-3col-item" className="flex flex-col gap-3">
            {feature.icon !== undefined && (
              <div
                data-slot="feature-3col-icon"
                className="flex size-10 items-center justify-center text-foreground"
              >
                {feature.icon}
              </div>
            )}
            <h3 className="text-base font-medium text-foreground">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

MosaicFeature3Col.displayName = "MosaicFeature3Col";
