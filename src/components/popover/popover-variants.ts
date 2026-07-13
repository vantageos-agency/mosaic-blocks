/**
 * popoverPopupVariants — pure CVA variant function for MosaicPopover.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React or
 * @base-ui/react.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Floating popup panel — anchored, transitions in/out with the positioner. */
export const popoverPopupVariants = cva([
  "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border",
  "bg-popover text-popover-foreground shadow-md outline-none",
  "origin-[var(--transform-origin)]",
  "transition-[transform,scale,opacity]",
  "data-[open]:scale-100 data-[open]:opacity-100",
  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
]);
