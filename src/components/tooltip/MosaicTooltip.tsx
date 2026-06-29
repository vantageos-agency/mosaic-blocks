/**
 * MosaicTooltip — @base-ui/react Tooltip primitive
 *
 * Builds on Tooltip.Provider + Tooltip.Root + Tooltip.Trigger +
 * Tooltip.Portal + Tooltip.Positioner + Tooltip.Popup.
 * role=tooltip managed by the primitive automatically.
 *
 * data-slot="tooltip-trigger" on Trigger, "tooltip-content" on Popup.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Tooltip } from "@base-ui/react/tooltip";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicTooltipProps {
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Tooltip content */
  content: React.ReactNode;
  /** Delay before opening (ms). @default 600 */
  delay?: number;
  /** Side to render the tooltip. @default "top" */
  side?: "top" | "bottom" | "left" | "right";
  /** Alignment on the cross axis. @default "center" */
  align?: "start" | "center" | "end";
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTooltip — production Tooltip atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/tooltip. Wraps trigger + content in a single component.
 * role=tooltip managed automatically. Keyboard (focus) + pointer accessible.
 *
 * @example
 * <MosaicTooltip content="Delete this item">
 *   <button>Delete</button>
 * </MosaicTooltip>
 *
 * <MosaicTooltip content="Saved!" side="bottom">
 *   <MosaicButton>Save</MosaicButton>
 * </MosaicTooltip>
 */
export function MosaicTooltip({
  children,
  content,
  delay = 600,
  side = "top",
  align = "center",
  className,
}: MosaicTooltipProps) {
  return (
    <Tooltip.Provider delay={delay}>
      <Tooltip.Root>
        <Tooltip.Trigger data-slot="tooltip-trigger" render={children as React.ReactElement} />
        <Tooltip.Portal>
          <Tooltip.Positioner side={side} align={align} sideOffset={6}>
            <Tooltip.Popup
              data-slot="tooltip-content"
              className={cn(
                "z-50 max-w-xs overflow-hidden rounded-md",
                "border border-border bg-foreground px-3 py-1.5",
                "text-xs text-background shadow-md",
                "origin-[var(--transform-origin)]",
                "transition-[transform,scale,opacity]",
                "data-[open]:scale-100 data-[open]:opacity-100",
                "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                className,
              )}
            >
              {content}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

MosaicTooltip.displayName = "MosaicTooltip";

// Named exports for compound usage
export { Tooltip };
