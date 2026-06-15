/**
 * MosaicFallingPattern — animated grid/dot background pattern
 *
 * Ported from heyfabrika/styleui components/grid-pattern / falling-pattern (MIT).
 * Implementation: SVG pattern + CSS animation for "falling" dot effect.
 * Zero extra deps — pure SVG/CSS.
 * Purely decorative: aria-hidden="true".
 * Color via prop (OKLCH string) — no hardcoded branding.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicFallingPatternProps {
  /**
   * Number of columns in the grid (default 12).
   * Higher = denser pattern.
   */
  density?: number;
  /**
   * Dot/grid line color (default "oklch(0.85 0.005 250)").
   * Accepts any CSS color string — use OKLCH for theme-reactive behavior.
   */
  color?: string;
  /** Animation duration for one full cycle in ms (default 4000) */
  animationDuration?: number;
  className?: string;
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const PATTERN_ANIM_ID = "mosaic-falling-pattern-kf";

function injectPatternKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PATTERN_ANIM_ID)) return;
  const style = document.createElement("style");
  style.id = PATTERN_ANIM_ID;
  style.textContent = `
    @keyframes mosaic-falling-dots {
      0%   { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(48px); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-falling-dot { animation: none !important; opacity: 0.5 !important; }
    }
  `;
  document.head.appendChild(style);
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicFallingPattern — decorative animated dot-grid background.
 * Position absolutely within a `relative overflow-hidden` container.
 *
 * @example
 * <div className="relative overflow-hidden min-h-96">
 *   <MosaicFallingPattern density={14} color="oklch(0.8 0.05 250)" />
 *   <YourContent className="relative z-10" />
 * </div>
 */
export const MosaicFallingPattern = React.forwardRef<HTMLDivElement, MosaicFallingPatternProps>(
  function MosaicFallingPattern(
    { density = 12, color = "oklch(0.85 0.005 250)", animationDuration = 4000, className },
    ref,
  ) {
    const uniqueId = React.useId();

    React.useEffect(() => {
      injectPatternKeyframes();
    }, []);

    // Build grid dots: density × (density / 2) dots for aspect ratio
    const cols = density;
    const rows = Math.ceil(density / 2);
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <pattern
              id={`mosaic-grid-${uniqueId}`}
              x="0"
              y="0"
              width={`${cellW}%`}
              height={`${cellH}%`}
              patternUnits="userSpaceOnUse"
            >
              <circle cx="50%" cy="50%" r="1.5" fill={color} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#mosaic-grid-${uniqueId})`} />
        </svg>

        {/* Falling animated dots — staggered across columns */}
        {Array.from({ length: cols }, (_, i) => {
          const leftPct = (i + 0.5) * cellW;
          const delay = (i / cols) * animationDuration;
          // col-N is stable: dots are positional columns, never reordered
          const colKey = `col-${i}`;
          return (
            <span
              key={colKey}
              className="mosaic-falling-dot"
              style={{
                position: "absolute",
                top: "-12px",
                left: `${leftPct}%`,
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: color,
                animation: `mosaic-falling-dots ${animationDuration}ms ease-in ${delay}ms infinite`,
                opacity: 0,
              }}
            />
          );
        })}
      </div>
    );
  },
);

MosaicFallingPattern.displayName = "MosaicFallingPattern";
