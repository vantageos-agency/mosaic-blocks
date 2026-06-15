"use client";

/**
 * MosaicCounter — animated metric count-up
 *
 * Ported from heyfabrika/styleui components/counter (MIT).
 * Animation decision: requestAnimationFrame with easeOutExpo — no `motion` dependency.
 * styleui uses CSS + JS approach; we match with rAF for bundle budget savings (~0 kb added).
 * Bundle impact: 0 extra deps (pure rAF).
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicCounterProps {
  /** Target numeric value to count to */
  value: number;
  /** Animation duration in ms (default 1500) */
  duration?: number;
  /** Optional format function applied to the current number */
  format?: (value: number) => string;
  className?: string;
}

// ── Easing ────────────────────────────────────────────────────────────────────

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicCounter — counts up from 0 to `value` on mount using requestAnimationFrame.
 * No external animation library required. Respects prefers-reduced-motion.
 *
 * @example
 * <MosaicCounter value={10000} duration={2000} format={(v) => `${Math.round(v).toLocaleString()}+`} />
 */
export const MosaicCounter = React.forwardRef<HTMLSpanElement, MosaicCounterProps>(
  function MosaicCounter({ value, duration = 1500, format, className }, ref) {
    const [current, setCurrent] = React.useState(0);
    const rafRef = React.useRef<number>(0);
    const startTimeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
      // Respect prefers-reduced-motion (guard: jsdom may not implement matchMedia)
      const prefersReduced =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        setCurrent(value);
        return;
      }

      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        setCurrent(Math.round(eased * value));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setCurrent(value);
        }
      };

      rafRef.current = requestAnimationFrame(animate);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [value, duration]);

    const display = format ? format(current) : String(current);

    return (
      <span
        ref={ref}
        className={className}
        style={{ fontVariantNumeric: "tabular-nums" }}
        aria-label={format ? format(value) : String(value)}
        aria-live="polite"
      >
        {display}
      </span>
    );
  },
);

MosaicCounter.displayName = "MosaicCounter";
