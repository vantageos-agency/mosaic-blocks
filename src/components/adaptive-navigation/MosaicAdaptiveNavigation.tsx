"use client";

/**
 * MosaicAdaptiveNavigation — tabs on desktop, accordion on mobile (PC-04)
 *
 * Ported (source: private upstream) components/adaptive/AdaptiveNavigation.tsx
 *
 * Desktop: horizontal tab strip (custom Tailwind tabs — no Radix dep).
 * Mobile: accordion-style collapsible list with step indicators.
 * Zero debate coupling. Generic items[] prop.
 *
 * Framer-motion: N/A (CSS transitions only).
 * Icons: inline SVG (no lucide dep).
 */

import type * as React from "react";
import { useDevice } from "../device-provider/MosaicDeviceProvider.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicNavigationItem {
  id: string;
  title: string;
  /** Optional duration label (e.g. seconds) */
  duration?: number;
  /** Whether this step is complete (shows checkmark) */
  isComplete?: boolean;
  /** Content rendered inside accordion panel (mobile only) */
  children?: React.ReactNode;
}

export interface MosaicAdaptiveNavigationProps {
  items: MosaicNavigationItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
  /** Controlled expanded set for accordion (mobile). If uncontrolled, pass undefined. */
  expandedItems?: Set<string>;
  onToggleExpanded?: (id: string) => void;
  /**
   * aria-label for the mobile accordion `<nav>`. Required — the host owns
   * the language (e.g. `t('AdaptiveNavigation.aria.step')`). No default.
   */
  stepNavAriaLabel: string;
  /**
   * aria-label for the desktop tab-strip `<nav>`. Required — the host owns
   * the language (e.g. `t('AdaptiveNavigation.aria.tab')`). No default.
   */
  tabNavAriaLabel: string;
  /** Status caption shown when a step is complete. Required, no default. */
  completeStatusLabel: string;
  /** Status caption shown when a step is not yet complete. Required, no default. */
  inProgressStatusLabel: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronDownIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: rotated ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 200ms ease-out",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAdaptiveNavigation — step navigation that adapts by device.
 * Desktop: tab strip. Mobile: expandable accordion with step indicators.
 *
 * @example
 * const [active, setActive] = useState(items[0].id);
 * const [expanded, setExpanded] = useState(new Set<string>());
 * const toggle = (id: string) =>
 *   setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
 *
 * <MosaicAdaptiveNavigation
 *   items={items}
 *   activeItem={active}
 *   onItemChange={setActive}
 *   expandedItems={expanded}
 *   onToggleExpanded={toggle}
 *   stepNavAriaLabel={t('AdaptiveNavigation.aria.step')}
 *   tabNavAriaLabel={t('AdaptiveNavigation.aria.tab')}
 * />
 */
export function MosaicAdaptiveNavigation({
  items,
  activeItem,
  onItemChange,
  expandedItems,
  onToggleExpanded,
  stepNavAriaLabel,
  tabNavAriaLabel,
  completeStatusLabel,
  inProgressStatusLabel,
  className,
  ref,
}: MosaicAdaptiveNavigationProps) {
  const { isMobile } = useDevice();

  if (isMobile) {
    return (
      <nav
        ref={ref}
        data-slot="adaptive-navigation"
        className={cn("space-y-3", className)}
        aria-label={stepNavAriaLabel}
      >
        {items.map((item, idx) => {
          const isExpanded = expandedItems?.has(item.id) ?? false;
          return (
            <div key={item.id} className="overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted"
                onClick={() => onToggleExpanded?.(item.id)}
                aria-expanded={isExpanded}
                aria-controls={`mosaic-nav-panel-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      // allow-undeclared-theme-token: success-500 wired to canonical --mosaic-color-success-* (status triads are NOT aliased, #64); resolves via @import "@vantageos/mosaic-tokens/css" at styles.css:4; hand-declaring `var(--success-500)` here would duplicate tokens.css (derive-never-type).
                      item.isComplete
                        ? "bg-success-500 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {item.isComplete ? <CheckIcon /> : idx + 1}
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.isComplete ? completeStatusLabel : inProgressStatusLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.duration !== undefined && (
                    <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {item.duration}s
                    </span>
                  )}
                  <ChevronDownIcon rotated={isExpanded} />
                </div>
              </button>

              {isExpanded && item.children && (
                <div id={`mosaic-nav-panel-${item.id}`} className="border-t border-border p-4">
                  {item.children}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  // Desktop tabs
  return (
    <nav
      ref={ref}
      data-slot="adaptive-navigation"
      className={cn("w-full", className)}
      aria-label={tabNavAriaLabel}
    >
      <div
        role="tablist"
        className="flex w-full rounded-lg bg-muted p-1"
        style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item, idx) => {
          const isActive = item.id === activeItem;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onItemChange(item.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  // allow-undeclared-theme-token: success-500 wired to canonical --mosaic-color-success-* (status triads are NOT aliased, #64); resolves via @import "@vantageos/mosaic-tokens/css" at styles.css:4; hand-declaring `var(--success-500)` here would duplicate tokens.css (derive-never-type).
                  item.isComplete
                    ? "bg-success-500 text-white"
                    : isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {item.isComplete ? <CheckIcon /> : idx + 1}
              </div>
              <span className="hidden sm:inline">{item.title}</span>
              {item.duration !== undefined && (
                <span
                  className={cn(
                    "rounded px-1 py-0.5 text-xs",
                    isActive ? "bg-primary-foreground/20" : "bg-muted",
                  )}
                >
                  {item.duration}s
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

MosaicAdaptiveNavigation.displayName = "MosaicAdaptiveNavigation";
