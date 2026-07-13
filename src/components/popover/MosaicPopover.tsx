"use client";

/**
 * MosaicPopover — @base-ui/react Popover primitive, anchored to any host element
 *
 * Built on @base-ui/react/popover. Fully host-controlled (`open` +
 * `onOpenChange`) and anchored via an explicit `anchor` ref rather than a
 * built-in `Popover.Trigger` button — the trigger does not have to be a
 * `<button>`. This makes the component equally at home wrapping a menu
 * button and anchoring to a text input mid-typing (e.g. a mention-input
 * that opens a list of selectable entries while the caret stays inside the
 * input).
 *
 * The popover owns exactly three things: anchoring, dismissal (Escape,
 * outside click), and focus management. It owns none of the content: the
 * list, its items, filtering, selection — all of that is supplied by the
 * host as `children` and surfaced back through the host's own callbacks.
 * Non-modal by default (`modal={false}`) so a host anchoring to a live text
 * input is not forced into a focus trap; pass `modal` to opt into stronger
 * guarantees for other use cases (e.g. a standalone popover menu).
 *
 * data-slot="popover" on the popup root, "popover-positioner" on the
 * positioning wrapper.
 *
 * SIN-01: the component carries zero visible strings. Every prop is either
 * structural (open/anchor/children) or an optional pass-through
 * (`aria-label`) with no default value — the host decides whether and what
 * to set.
 */

import { Popover } from "@base-ui/react/popover";
import type * as React from "react";
import { popoverPopupVariants } from "./popover-variants.js";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface MosaicPopoverProps {
  /** Controlled open state — the host owns the truth. */
  open: boolean;
  /** Controlled state setter, called on every open/close intent. */
  onOpenChange: (open: boolean) => void;
  /**
   * The element the popup is positioned against. Any host element — a
   * button, a text input, a table cell — not limited to a
   * `Popover.Trigger`-rendered button.
   */
  anchor: React.RefObject<Element | null>;
  /** Host-owned content: list, form, or any other panel body. */
  children: React.ReactNode;
  /** Side of the anchor the popup opens toward. @default "bottom" */
  side?: "top" | "bottom" | "left" | "right";
  /** Alignment relative to the anchor. @default "start" */
  align?: "start" | "center" | "end";
  /**
   * Interaction scope while open.
   * - `false` (default): the rest of the page stays interactive — the
   *   right choice when anchoring to a live input the host wants to keep
   *   receiving keystrokes.
   * - `true` / `"trap-focus"`: stronger isolation for standalone popover
   *   menus.
   * @default false
   */
  modal?: boolean | "trap-focus";
  /**
   * Element to move focus to when the popup opens. `false` leaves focus on
   * the host's own anchor (e.g. a text input mid-typing); `true` moves
   * focus to the first tabbable element inside the popup.
   * @default false
   */
  initialFocus?: boolean | React.RefObject<HTMLElement | null>;
  /**
   * Optional accessible name for the popup surface. No default — omit it
   * when the host's content already carries its own accessible structure
   * (e.g. a labelled list).
   */
  "aria-label"?: string;
  className?: string;
}

/**
 * MosaicPopover — anchored floating panel for @vantageos/mosaic-blocks.
 *
 * @example
 * // Anchored to a live text input; focus stays on the input while the
 * // host renders its own selectable list of entries.
 * const anchorRef = useRef<HTMLInputElement>(null);
 * <input ref={anchorRef} onChange={handleTyping} />
 * <MosaicPopover open={open} onOpenChange={setOpen} anchor={anchorRef}>
 *   <ul role="listbox">
 *     {entries.map((entry) => (
 *       <li key={entry.id}>
 *         <button type="button" onClick={() => selectEntry(entry)}>
 *           {entry.label}
 *         </button>
 *       </li>
 *     ))}
 *   </ul>
 * </MosaicPopover>
 */
export function MosaicPopover({
  open,
  onOpenChange,
  anchor,
  children,
  side = "bottom",
  align = "start",
  modal = false,
  initialFocus = false,
  "aria-label": ariaLabel,
  className,
}: MosaicPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)} modal={modal}>
      <Popover.Portal>
        <Popover.Positioner
          data-slot="popover-positioner"
          anchor={anchor}
          side={side}
          align={align}
          sideOffset={4}
        >
          <Popover.Popup
            data-slot="popover"
            aria-label={ariaLabel}
            initialFocus={initialFocus}
            className={cn(popoverPopupVariants(), className)}
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

MosaicPopover.displayName = "MosaicPopover";
