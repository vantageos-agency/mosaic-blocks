"use client";

/**
 * MosaicQuickActionCard — 6-accent action card grid (PC-07)
 *
 * Ported (source: private upstream) components/dashboard/QuickActions.tsx
 *
 * Renders a grid of action cards. Each card: icon slot, title, description,
 * accent color variant (6 presets: yellow, blue, green, purple, orange, cyan).
 * Cards have hover scale (CSS) + stagger reveal (CSS keyframes).
 *
 * Generalized: hardcoded debate hrefs stripped; externalized as actions[] prop.
 * Icon: caller-provided ReactNode (any SVG/component).
 * Link: uses <a> by default; provide renderLink prop for router-aware links.
 *
 * Framer-motion replaced with CSS keyframe stagger (precedent: MosaicAnimatedList).
 * Respects prefers-reduced-motion.
 * Icons: caller-provided (no lucide dep).
 */

import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Keyframe injection ────────────────────────────────────────────────────────

const ANIM_ID = "mosaic-quick-action-kf";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const s = document.createElement("style");
  s.id = ANIM_ID;
  s.textContent = `
    @keyframes mosaic-action-in {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    .mosaic-action-item {
      opacity: 0;
      animation: mosaic-action-in 250ms ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .mosaic-action-item {
        animation: none !important;
        opacity: 1 !important;
      }
    }
  `;
  document.head.appendChild(s);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicActionAccent =
  | "yellow"
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "cyan"
  | "gray";

export interface MosaicQuickAction {
  /** Stable unique identifier for this action */
  id: string;
  title: string;
  description: string;
  /** Icon node — caller provides any SVG or component (no lucide dep) */
  icon: React.ReactNode;
  href: string;
  /** Accent color preset (default "blue") */
  accent?: MosaicActionAccent;
}

export interface MosaicQuickActionCardProps {
  actions: MosaicQuickAction[];
  /** Section heading (optional) */
  heading?: string;
  /** Custom columns (default: 2 mobile, 3 desktop) */
  columns?: { mobile?: number; desktop?: number };
  /**
   * Custom link renderer — use for Next.js Link or router-aware navigation.
   * Receives href + children, must return a valid anchor-like element.
   * Default: native <a>.
   */
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Accent map ────────────────────────────────────────────────────────────────

const ACCENT_CLASSES: Record<MosaicActionAccent, string> = {
  yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  green: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  purple: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  orange: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  cyan: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
  gray: "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicQuickActionCard — grid of action cards with 6 accent variants.
 * Each card links to an href. Fully props-driven; no hardcoded routes.
 *
 * @example
 * <MosaicQuickActionCard
 *   heading="Quick Actions"
 *   actions={[
 *     { id: "create", title: "Create", description: "Start new item", icon: <PlusIcon />, href: "/create", accent: "green" },
 *   ]}
 * />
 */
export function MosaicQuickActionCard({
  actions,
  heading,
  columns = {},
  renderLink,
  className,
  ref,
}: MosaicQuickActionCardProps) {
  const { mobile = 2, desktop = 3 } = columns;

  React.useEffect(() => {
    injectStyles();
  }, []);

  const defaultRenderLink = (href: string, children: React.ReactNode) => (
    <a href={href} className="block h-full">
      {children}
    </a>
  );

  const link = renderLink ?? defaultRenderLink;

  return (
    <div
      ref={ref}
      data-slot="quick-action-card"
      className={cn("rounded-xl border border-border bg-card", className)}
    >
      {heading && (
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
        </div>
      )}
      <div
        className="p-6"
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: `repeat(${mobile}, minmax(0, 1fr))`,
        }}
      >
        {actions.map((action, idx) => {
          const accent = action.accent ?? "blue";
          const accentClass = ACCENT_CLASSES[accent];

          return (
            <div
              key={action.id}
              className="mosaic-action-item h-full"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {link(
                action.href,
                <div
                  className={cn(
                    "flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border p-4",
                    "transition-transform duration-150 hover:scale-105 active:scale-[0.98]",
                    accentClass,
                  )}
                >
                  <div className="shrink-0 text-[1.4rem] leading-none" aria-hidden="true">
                    {action.icon}
                  </div>
                  <div className="w-full space-y-0.5 text-center">
                    <p className="text-sm font-medium leading-tight">{action.title}</p>
                    <p className="text-xs leading-tight text-current/70">{action.description}</p>
                  </div>
                </div>,
              )}
            </div>
          );
        })}
      </div>

      {/* Responsive desktop columns via style injection avoids JIT dynamic class issue */}
      <style>{`
        @media (min-width: 768px) {
          [data-slot="quick-action-card"] > div:last-child {
            grid-template-columns: repeat(${desktop}, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

MosaicQuickActionCard.displayName = "MosaicQuickActionCard";
