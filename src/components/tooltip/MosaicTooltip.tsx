/**
 * MosaicTooltip — @base-ui/react Tooltip primitive
 *
 * Builds on Tooltip.Provider + Tooltip.Root + Tooltip.Trigger +
 * Tooltip.Portal + Tooltip.Positioner + Tooltip.Popup.
 * role=tooltip managed by the primitive automatically.
 *
 * data-slot="tooltip-trigger" on Trigger, "tooltip-content" on Popup.
 * Styling: Tailwind v4 semantic tokens only.
 *
 * Sub-components (MosaicTooltipProvider / MosaicTooltipRoot /
 * MosaicTooltipTrigger / MosaicTooltipContent) are exported individually
 * so hosts can compose custom tooltip trees (issue #35), in addition to
 * the compound `MosaicTooltip` convenience component below.
 */

import { Tooltip } from "@base-ui/react/tooltip";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

const CONTENT_CLASS_NAME = cn(
  "z-50 max-w-xs overflow-hidden rounded-md",
  "border border-border bg-foreground px-3 py-1.5",
  "text-xs text-background shadow-md",
  "origin-[var(--transform-origin)]",
  "transition-[transform,scale,opacity]",
  "data-[open]:scale-100 data-[open]:opacity-100",
  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
);

// ── Sub-components ───────────────────────────────────────────────────────────

export interface MosaicTooltipProviderProps {
  children: React.ReactNode;
  /** Delay before opening any tooltip in this group (ms). @default 600 */
  delay?: number;
  /** Delay before closing any tooltip in this group (ms). */
  closeDelay?: number;
}

/**
 * MosaicTooltipProvider — groups tooltips so adjacent triggers open
 * instantly once one tooltip in the group is already visible.
 *
 * @example
 * <MosaicTooltipProvider delay={600}>
 *   <MosaicTooltipRoot>
 *     <MosaicTooltipTrigger asChild>
 *       <button>Hover me</button>
 *     </MosaicTooltipTrigger>
 *     <MosaicTooltipContent>Helpful tip</MosaicTooltipContent>
 *   </MosaicTooltipRoot>
 * </MosaicTooltipProvider>
 */
export function MosaicTooltipProvider({
  children,
  delay = 600,
  closeDelay,
}: MosaicTooltipProviderProps) {
  return (
    <Tooltip.Provider delay={delay} closeDelay={closeDelay}>
      {children}
    </Tooltip.Provider>
  );
}

MosaicTooltipProvider.displayName = "MosaicTooltipProvider";

export interface MosaicTooltipRootProps {
  children: React.ReactNode;
  /** Whether the tooltip is initially open (uncontrolled). @default false */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * MosaicTooltipRoot — groups a single Trigger + Content pair. Required by
 * @base-ui/react/tooltip's architecture: the Trigger and the Content must
 * share a Root to coordinate open state and positioning anchor.
 */
export function MosaicTooltipRoot({
  children,
  defaultOpen,
  open,
  onOpenChange,
}: MosaicTooltipRootProps) {
  return (
    <Tooltip.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      {children}
    </Tooltip.Root>
  );
}

MosaicTooltipRoot.displayName = "MosaicTooltipRoot";

export interface MosaicTooltipTriggerProps {
  children: React.ReactElement;
  /** Merge props onto `children` instead of rendering a wrapping `<button>`. @default false */
  asChild?: boolean;
  className?: string;
}

/**
 * MosaicTooltipTrigger — the element that opens the tooltip on hover/focus.
 * Pass `asChild` to attach the trigger behavior directly to a single child
 * element instead of wrapping it in a `<button>`.
 */
export function MosaicTooltipTrigger({
  children,
  asChild = false,
  className,
}: MosaicTooltipTriggerProps) {
  if (asChild) {
    return <Tooltip.Trigger data-slot="tooltip-trigger" className={className} render={children} />;
  }
  return (
    <Tooltip.Trigger data-slot="tooltip-trigger" className={className}>
      {children}
    </Tooltip.Trigger>
  );
}

MosaicTooltipTrigger.displayName = "MosaicTooltipTrigger";

export interface MosaicTooltipContentProps {
  children: React.ReactNode;
  /** Side to render the tooltip. @default "top" */
  side?: "top" | "bottom" | "left" | "right";
  /** Alignment on the cross axis. @default "center" */
  align?: "start" | "center" | "end";
  /** Offset (px) between the trigger and the tooltip. @default 6 */
  sideOffset?: number;
  /** Native `hidden` attribute, forwarded to the popup element. */
  hidden?: boolean;
  className?: string;
}

/**
 * MosaicTooltipContent — portalled, positioned tooltip popup. Must be
 * rendered inside a `MosaicTooltipRoot`.
 */
export function MosaicTooltipContent({
  children,
  side = "top",
  align = "center",
  sideOffset = 6,
  hidden,
  className,
}: MosaicTooltipContentProps) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
        <Tooltip.Popup
          data-slot="tooltip-content"
          hidden={hidden}
          className={cn(CONTENT_CLASS_NAME, className)}
        >
          {children}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  );
}

MosaicTooltipContent.displayName = "MosaicTooltipContent";

// ── Compound props ───────────────────────────────────────────────────────────

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
              className={cn(CONTENT_CLASS_NAME, className)}
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
