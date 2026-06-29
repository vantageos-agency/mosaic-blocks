/**
 * MosaicTabs — @base-ui/react Tabs primitive
 *
 * Builds on Tabs.Root + Tabs.List + Tabs.Tab + Tabs.Panel + Tabs.Indicator.
 * Supports controlled (value + onValueChange) and uncontrolled modes.
 * role=tablist, role=tab, role=tabpanel managed by the primitive automatically.
 *
 * data-slot="tabs" on Root, "tabs-list" on List, "tabs-trigger" on Tab,
 * "tabs-panel" on Panel.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Tabs } from "@base-ui/react/tabs";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicTabsProps extends Tabs.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export interface MosaicTabsListProps extends Tabs.List.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

export interface MosaicTabsTriggerProps extends Tabs.Tab.Props {
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export interface MosaicTabsPanelProps extends Tabs.Panel.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Components ────────────────────────────────────────────────────────────────

/**
 * MosaicTabs — production Tabs root for @vantageos/mosaic-blocks.
 *
 * Compose with MosaicTabsList, MosaicTabsTrigger, MosaicTabsPanel.
 *
 * @example
 * <MosaicTabs defaultValue="overview">
 *   <MosaicTabsList>
 *     <MosaicTabsTrigger value="overview">Overview</MosaicTabsTrigger>
 *     <MosaicTabsTrigger value="details">Details</MosaicTabsTrigger>
 *   </MosaicTabsList>
 *   <MosaicTabsPanel value="overview">Overview content</MosaicTabsPanel>
 *   <MosaicTabsPanel value="details">Details content</MosaicTabsPanel>
 * </MosaicTabs>
 */
export function MosaicTabs({ className, ref, ...props }: MosaicTabsProps) {
  return (
    <Tabs.Root
      ref={ref}
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

MosaicTabs.displayName = "MosaicTabs";

/**
 * MosaicTabsList — the tab bar containing tab triggers.
 */
export function MosaicTabsList({ className, ref, ...props }: MosaicTabsListProps) {
  return (
    <Tabs.List
      ref={ref}
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex items-center justify-start gap-1",
        "rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

MosaicTabsList.displayName = "MosaicTabsList";

/**
 * MosaicTabsTrigger — individual tab button.
 * Must supply a `value` prop matching the corresponding MosaicTabsPanel value.
 */
export function MosaicTabsTrigger({ className, ref, ...props }: MosaicTabsTriggerProps) {
  return (
    <Tabs.Tab
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
        "rounded-md px-3 py-1.5 text-sm font-medium",
        "outline-none transition-all",
        "focus-visible:ring-ring focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Selected state
        "data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-xs",
        // Unselected hover
        "hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

MosaicTabsTrigger.displayName = "MosaicTabsTrigger";

/**
 * MosaicTabsPanel — content panel revealed by the corresponding tab trigger.
 * Must supply a `value` prop matching the corresponding MosaicTabsTrigger value.
 */
export function MosaicTabsPanel({ className, ref, ...props }: MosaicTabsPanelProps) {
  return (
    <Tabs.Panel
      ref={ref}
      data-slot="tabs-panel"
      className={cn(
        "flex-1 outline-none",
        "focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:rounded-md",
        className,
      )}
      {...props}
    />
  );
}

MosaicTabsPanel.displayName = "MosaicTabsPanel";
