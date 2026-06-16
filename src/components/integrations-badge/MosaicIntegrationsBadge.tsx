/**
 * MosaicIntegrationsBadge — integration badge / pill
 *
 * Ported from heyfabrika/styleui components/integrations-badge (MIT).
 * Props-driven: logo slot (ReactNode), label string, optional href.
 * Theme-reactive via OKLCH CSS variables; no hardcoded branding colors.
 * Zero extra deps — pure HTML/CSS.
 */

import type * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicIntegrationsBadgeProps {
  /** Badge label text (e.g. "Stripe", "GitHub") */
  label: string;
  /** Optional logo/icon slot — use <img>, <svg>, or any ReactNode */
  logo?: React.ReactNode;
  /** When provided, renders the badge as an <a> tag */
  href?: string;
  /** Link target (default "_blank" for external links) */
  target?: React.HTMLAttributeAnchorTarget;
  className?: string;
  ref?: React.Ref<HTMLAnchorElement & HTMLSpanElement>;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const badgeClass =
  "inline-flex items-center gap-2 rounded-full border border-[oklch(0.88_0.01_250)] bg-[oklch(0.98_0.005_250)] px-3 py-1.5 text-sm font-medium text-[oklch(0.25_0.01_250)] shadow-[0_1px_3px_oklch(0_0_0_/_0.06)] transition-colors";

const hoverClass =
  "hover:border-[oklch(0.8_0.01_250)] hover:bg-[oklch(0.96_0.005_250)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.15_250)]";

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicIntegrationsBadge — pill-shaped badge showing a logo + label.
 * Renders as `<a>` when `href` is provided.
 *
 * @example
 * <MosaicIntegrationsBadge
 *   label="Stripe"
 *   logo={<img src="/stripe-logo.svg" alt="" width={16} height={16} />}
 *   href="https://stripe.com"
 * />
 */
export function MosaicIntegrationsBadge({
  label,
  logo,
  href,
  target = "_blank",
  className,
  ref,
}: MosaicIntegrationsBadgeProps) {
  const inner = (
    <>
      {logo && <span className="flex shrink-0 items-center">{logo}</span>}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={cn(badgeClass, hoverClass, className)}
      >
        {inner}
      </a>
    );
  }

  return (
    <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(badgeClass, className)}>
      {inner}
    </span>
  );
}

MosaicIntegrationsBadge.displayName = "MosaicIntegrationsBadge";
