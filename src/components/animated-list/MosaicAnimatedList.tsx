"use client";

/**
 * MosaicAnimatedList — staggered reveal list
 *
 * Ported from heyfabrika/styleui components/animated-list (MIT).
 * Animation decision: CSS keyframe animation with inline `animation-delay` stagger.
 * No `motion` dependency — saves ~45 kb gzip. This matches styleui's approach
 * of preferring CSS-first animation for simple stagger reveals.
 * Bundle impact: 0 extra deps (pure CSS animations).
 * Respects prefers-reduced-motion.
 */

import * as React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAnimatedListProps {
  /** Delay between each item animation in ms (default 80) */
  stagger?: number;
  children: React.ReactNode;
  className?: string;
  /** Wrapper element tag (default "ul") */
  as?: "ul" | "ol" | "div";
}

// ── Keyframe style injection ──────────────────────────────────────────────────

const ANIMATION_ID = "mosaic-animated-list-kf";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIMATION_ID)) return;
  const style = document.createElement("style");
  style.id = ANIMATION_ID;
  style.textContent = `
    @keyframes mosaic-list-item-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-list-item { animation: none !important; opacity: 1 !important; transform: none !important; }
    }
  `;
  document.head.appendChild(style);
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAnimatedList — wraps children in a list, stagger-revealing each item
 * on mount via CSS keyframe animations. Accessible: respects prefers-reduced-motion.
 *
 * @example
 * <MosaicAnimatedList stagger={100}>
 *   <li>First feature</li>
 *   <li>Second feature</li>
 *   <li>Third feature</li>
 * </MosaicAnimatedList>
 */
export const MosaicAnimatedList = React.forwardRef<HTMLElement, MosaicAnimatedListProps>(
  function MosaicAnimatedList({ stagger = 80, children, className, as: Tag = "ul" }, ref) {
    React.useEffect(() => {
      injectKeyframes();
    }, []);

    const items = React.Children.toArray(children);

    return (
      <Tag
        ref={ref as React.Ref<HTMLUListElement & HTMLOListElement & HTMLDivElement>}
        className={className}
      >
        {items.map((child, i) => {
          // React.Children.toArray() assigns stable .key values like ".$key"
          const stableKey = (child as React.ReactElement).key ?? `item-${i}`;
          return (
            <React.Fragment key={stableKey}>
              <div
                className="mosaic-list-item"
                style={{
                  opacity: 0,
                  animation: `mosaic-list-item-in 400ms ease-out ${i * stagger}ms forwards`,
                }}
              >
                {child}
              </div>
            </React.Fragment>
          );
        })}
      </Tag>
    );
  },
);

MosaicAnimatedList.displayName = "MosaicAnimatedList";
