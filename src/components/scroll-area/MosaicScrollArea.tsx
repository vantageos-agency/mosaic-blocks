/**
 * MosaicScrollArea — @base-ui/react ScrollArea primitive
 *
 * Builds on ScrollArea.Root + ScrollArea.Viewport + ScrollArea.Content +
 * ScrollArea.Scrollbar + ScrollArea.Thumb + ScrollArea.Corner.
 * Custom scrollbar styling that matches design tokens.
 * Native scroll behavior with custom scrollbar overlay.
 *
 * data-slot="scroll-area" on Root, "scroll-area-viewport" on Viewport,
 * "scroll-area-scrollbar" on Scrollbar, "scroll-area-thumb" on Thumb.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { ScrollArea } from "@base-ui/react/scroll-area";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicScrollAreaProps extends ScrollArea.Root.Props {
  className?: string;
  /** Whether to show horizontal scrollbar. @default false */
  horizontal?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicScrollArea — production ScrollArea atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/scroll-area. Custom scrollbar with semantic tokens.
 * Shows vertical scrollbar by default; set horizontal to show horizontal bar too.
 *
 * @example
 * <MosaicScrollArea className="h-48">
 *   <div>Long content here…</div>
 * </MosaicScrollArea>
 */
export function MosaicScrollArea({
  className,
  horizontal = false,
  children,
  ref,
  ...props
}: MosaicScrollAreaProps) {
  return (
    <ScrollArea.Root
      ref={ref}
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollArea.Viewport data-slot="scroll-area-viewport" className="size-full rounded-[inherit]">
        <ScrollArea.Content>{children}</ScrollArea.Content>
      </ScrollArea.Viewport>

      {/* Vertical scrollbar */}
      <ScrollArea.Scrollbar
        data-slot="scroll-area-scrollbar"
        orientation="vertical"
        className="flex w-2.5 touch-none select-none border-l border-l-transparent p-px transition-colors"
      >
        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollArea.Scrollbar>

      {/* Horizontal scrollbar (opt-in) */}
      {horizontal && (
        <ScrollArea.Scrollbar
          data-slot="scroll-area-scrollbar-h"
          orientation="horizontal"
          className="flex h-2.5 touch-none select-none flex-col border-t border-t-transparent p-px transition-colors"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollArea.Scrollbar>
      )}

      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}

MosaicScrollArea.displayName = "MosaicScrollArea";
