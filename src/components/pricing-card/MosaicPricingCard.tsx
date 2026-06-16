/**
 * MosaicPricingCard — single pricing tier card
 *
 * Ported from heyfabrika/styleui blocks/pricing/pricing-card.tsx (MIT).
 * Adapted: props-driven (tier, price, features, cta, highlighted).
 * No shadcn Card/Badge imports — self-contained for lib portability.
 * Styling: Tailwind v4 + OKLCH tokens.
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PricingCta {
  label: string;
  href: string;
}

export interface MosaicPricingCardProps {
  /** Tier name, e.g. "Free", "Pro", "Enterprise" */
  tier: string;
  /** Price string, e.g. "$19/mo" or "Free" */
  price: string;
  /** Feature list items */
  features: string[];
  /** CTA button config */
  cta: PricingCta;
  /** Highlighted tier — renders with accent border + tinted background */
  highlighted?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicPricingCard — a single pricing tier. Compose multiple inside a flex/grid
 * wrapper to build a full pricing section.
 *
 * @example
 * <MosaicPricingCard
 *   tier="Pro"
 *   price="$19/mo"
 *   features={["Unlimited projects", "Priority support", "Custom domain"]}
 *   cta={{ label: "Get started", href: "/signup/pro" }}
 *   highlighted
 * />
 */
export function MosaicPricingCard({
  tier,
  price,
  features,
  cta,
  highlighted = false,
  className,
  ref,
}: MosaicPricingCardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-72 flex-col gap-6 rounded-2xl border p-8",
        highlighted
          ? "border-[oklch(0.6_0.15_250_/_0.5)] bg-[oklch(0.97_0.02_250)]"
          : "border-[oklch(0.9_0.005_250)] bg-[oklch(1_0_0)]",
        className,
      )}
    >
      {/* Tier badge */}
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold",
          highlighted
            ? "border-transparent bg-[oklch(0.15_0.01_250)] text-[oklch(0.98_0_0)]"
            : "border-[oklch(0.85_0.01_250)] bg-[oklch(1_0_0)] text-[oklch(0.2_0.01_250)]",
        )}
      >
        {tier}
      </span>

      {/* Price */}
      <p className="text-xl font-semibold text-[oklch(0.12_0.01_250)]">{price}</p>

      {/* CTA */}
      <a
        href={cta.href}
        className={cn(
          "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          highlighted
            ? "bg-[oklch(0.15_0.01_250)] text-[oklch(0.98_0_0)] hover:bg-[oklch(0.25_0.01_250)]"
            : "border border-[oklch(0.75_0.01_250)] bg-transparent text-[oklch(0.15_0.01_250)] hover:bg-[oklch(0.96_0.005_250)]",
        )}
      >
        {cta.label}
      </a>

      {/* Features */}
      <ul className="flex flex-col gap-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-[oklch(0.35_0.01_250)]">
            {/* Check icon (inline SVG — no lucide-react dep) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-[oklch(0.5_0.12_145)]"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

MosaicPricingCard.displayName = "MosaicPricingCard";
