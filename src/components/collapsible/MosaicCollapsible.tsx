/**
 * MosaicCollapsible — @base-ui/react Collapsible primitive
 *
 * Builds on Collapsible.Root + Collapsible.Trigger + Collapsible.Panel.
 * Supports controlled (open + onOpenChange) and uncontrolled modes.
 * aria-expanded and aria-controls managed by the primitive automatically.
 *
 * data-slot="collapsible" on Root, "collapsible-trigger" on Trigger,
 * "collapsible-panel" on Panel.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Collapsible } from "@base-ui/react/collapsible";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicCollapsibleProps extends Collapsible.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export interface MosaicCollapsibleTriggerProps extends Collapsible.Trigger.Props {
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export interface MosaicCollapsiblePanelProps extends Collapsible.Panel.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Components ────────────────────────────────────────────────────────────────

/**
 * MosaicCollapsible — production Collapsible root for @vantageos/mosaic-blocks.
 *
 * Wrap with MosaicCollapsibleTrigger and MosaicCollapsiblePanel.
 *
 * @example
 * <MosaicCollapsible>
 *   <MosaicCollapsibleTrigger>Toggle</MosaicCollapsibleTrigger>
 *   <MosaicCollapsiblePanel>Content here</MosaicCollapsiblePanel>
 * </MosaicCollapsible>
 */
export function MosaicCollapsible({ className, ref, ...props }: MosaicCollapsibleProps) {
  return (
    <Collapsible.Root
      ref={ref}
      data-slot="collapsible"
      className={cn("w-full", className)}
      {...props}
    />
  );
}

MosaicCollapsible.displayName = "MosaicCollapsible";

/**
 * MosaicCollapsibleTrigger — toggle button for MosaicCollapsible.
 *
 * @example
 * <MosaicCollapsibleTrigger>Show more</MosaicCollapsibleTrigger>
 */
export function MosaicCollapsibleTrigger({
  className,
  ref,
  ...props
}: MosaicCollapsibleTriggerProps) {
  return (
    <Collapsible.Trigger
      ref={ref}
      data-slot="collapsible-trigger"
      className={cn(
        "inline-flex w-full items-center justify-between gap-2",
        "rounded-md px-0 py-2 text-sm font-medium",
        "text-foreground outline-none transition-colors",
        "hover:text-foreground/80",
        "focus-visible:ring-ring focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>svg]:transition-transform [&>svg]:duration-200",
        "data-[panel-open]:[&>svg]:rotate-180",
        className,
      )}
      {...props}
    />
  );
}

MosaicCollapsibleTrigger.displayName = "MosaicCollapsibleTrigger";

/**
 * MosaicCollapsiblePanel — collapsible content panel for MosaicCollapsible.
 *
 * @example
 * <MosaicCollapsiblePanel>Hidden content</MosaicCollapsiblePanel>
 */
export function MosaicCollapsiblePanel({ className, ref, ...props }: MosaicCollapsiblePanelProps) {
  return (
    <Collapsible.Panel
      ref={ref}
      data-slot="collapsible-panel"
      className={cn(
        "overflow-hidden text-sm transition-all",
        "data-[open]:animate-in data-[closed]:animate-out",
        className,
      )}
      {...props}
    />
  );
}

MosaicCollapsiblePanel.displayName = "MosaicCollapsiblePanel";
