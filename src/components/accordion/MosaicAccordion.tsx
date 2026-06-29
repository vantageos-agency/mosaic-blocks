/**
 * MosaicAccordion — @base-ui/react Accordion primitive
 *
 * Builds on Accordion.Root + Accordion.Item + Accordion.Header +
 * Accordion.Trigger + Accordion.Panel.
 * Supports single and multiple expansion modes.
 * role=button + aria-expanded + aria-controls managed by the primitive.
 *
 * data-slot="accordion" on Root, "accordion-item" on Item,
 * "accordion-trigger" on Trigger, "accordion-panel" on Panel.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Accordion } from "@base-ui/react/accordion";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicAccordionProps extends Accordion.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export interface MosaicAccordionItemProps extends Accordion.Item.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export interface MosaicAccordionTriggerProps extends Omit<Accordion.Trigger.Props, "ref"> {
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export interface MosaicAccordionPanelProps extends Accordion.Panel.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Components ────────────────────────────────────────────────────────────────

/**
 * MosaicAccordion — production Accordion root for @vantageos/mosaic-blocks.
 *
 * Compose with MosaicAccordionItem, MosaicAccordionTrigger, MosaicAccordionPanel.
 * By default, only one item can be open at a time (openMultiple={false}).
 *
 * @example
 * <MosaicAccordion>
 *   <MosaicAccordionItem value="item-1">
 *     <Accordion.Header>
 *       <MosaicAccordionTrigger>Section 1</MosaicAccordionTrigger>
 *     </Accordion.Header>
 *     <MosaicAccordionPanel>Content 1</MosaicAccordionPanel>
 *   </MosaicAccordionItem>
 * </MosaicAccordion>
 */
export function MosaicAccordion({ className, ref, ...props }: MosaicAccordionProps) {
  return (
    <Accordion.Root
      ref={ref}
      data-slot="accordion"
      className={cn("w-full divide-y divide-border", className)}
      {...props}
    />
  );
}

MosaicAccordion.displayName = "MosaicAccordion";

/**
 * MosaicAccordionItem — individual accordion item wrapper.
 * Must supply a unique `value` prop.
 */
export function MosaicAccordionItem({ className, ref, ...props }: MosaicAccordionItemProps) {
  return (
    <Accordion.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn("py-0", className)}
      {...props}
    />
  );
}

MosaicAccordionItem.displayName = "MosaicAccordionItem";

/**
 * MosaicAccordionTrigger — toggle button inside an accordion item header.
 * Must be placed inside an Accordion.Header.
 */
export function MosaicAccordionTrigger({
  className,
  children,
  ref,
  ...props
}: MosaicAccordionTriggerProps) {
  return (
    <Accordion.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={cn(
        "flex w-full flex-1 items-center justify-between py-4",
        "text-sm font-medium text-foreground",
        "outline-none transition-all",
        "hover:text-foreground/80",
        "focus-visible:ring-ring focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>svg]:transition-transform [&>svg]:duration-200",
        "data-[panel-open]:[&>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      {/* Chevron icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Accordion.Trigger>
  );
}

MosaicAccordionTrigger.displayName = "MosaicAccordionTrigger";

/**
 * MosaicAccordionPanel — collapsible content area for an accordion item.
 */
export function MosaicAccordionPanel({ className, ref, ...props }: MosaicAccordionPanelProps) {
  return (
    <Accordion.Panel
      ref={ref}
      data-slot="accordion-panel"
      className={cn("overflow-hidden text-sm text-muted-foreground", "transition-all", className)}
      {...props}
    />
  );
}

MosaicAccordionPanel.displayName = "MosaicAccordionPanel";

// Re-export Header from base-ui for composition (no styling needed on header itself)
export { Accordion };
