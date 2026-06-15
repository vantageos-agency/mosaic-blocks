/**
 * MosaicBlurredOrb — decorative blurred gradient orb background
 *
 * Ported from heyfabrika/styleui components/blurred-orb (MIT).
 * Pure CSS/SVG — zero JS animation, zero extra deps.
 * Purely decorative: aria-hidden="true".
 * Colors via OKLCH props — no hardcoded branding.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrbPosition {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface MosaicBlurredOrbProps {
  /**
   * Array of 1–3 OKLCH color strings.
   * Default: ["oklch(0.7 0.15 250)", "oklch(0.65 0.18 290)"]
   */
  colors?: string[];
  /** Orb diameter in pixels (default 500) */
  size?: number;
  /** CSS position values — absolute positioning anchors */
  position?: OrbPosition;
  /** Blur strength in pixels (default 80) */
  blur?: number;
  /** Opacity 0–1 (default 0.6) */
  opacity?: number;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicBlurredOrb — absolutely-positioned blurred gradient blob.
 * Wrap the parent container in `position: relative; overflow: hidden`.
 *
 * @example
 * <div className="relative overflow-hidden">
 *   <MosaicBlurredOrb
 *     colors={["oklch(0.7 0.2 250)", "oklch(0.6 0.15 300)"]}
 *     size={600}
 *     position={{ top: "-10%", left: "-5%" }}
 *   />
 *   <YourContent />
 * </div>
 */
export const MosaicBlurredOrb = React.forwardRef<HTMLDivElement, MosaicBlurredOrbProps>(
  function MosaicBlurredOrb(
    {
      colors = ["oklch(0.7 0.15 250)", "oklch(0.65 0.18 290)"],
      size = 500,
      position = { top: "-15%", left: "-10%" },
      blur = 80,
      opacity = 0.6,
      className,
    },
    ref,
  ) {
    // Build gradient stops from colors array
    const gradientStops = colors
      .map((color, i) => {
        const pct = Math.round((i / Math.max(colors.length - 1, 1)) * 100);
        return `${color} ${pct}%`;
      })
      .join(", ");

    const gradient =
      colors.length === 1
        ? `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`
        : `radial-gradient(circle, ${gradientStops}, transparent 75%)`;

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={className}
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          background: gradient,
          filter: `blur(${blur}px)`,
          opacity,
          pointerEvents: "none",
          ...position,
        }}
      />
    );
  },
);

MosaicBlurredOrb.displayName = "MosaicBlurredOrb";
