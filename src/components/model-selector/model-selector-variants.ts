/**
 * modelSelectorVariants — pure CVA variant functions for MosaicModelSelector.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root trigger button — shows either the selected model summary or the placeholder. */
export const modelSelectorTriggerVariants = cva(
  [
    "flex w-full min-h-[44px] items-center justify-between gap-2 rounded-md border",
    "border-border bg-background px-3 py-2 text-left text-sm text-foreground shadow-xs",
    "outline-none transition-colors hover:bg-muted",
    "focus-visible:ring-ring focus-visible:ring-[3px]",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "data-[popup-open]:ring-ring data-[popup-open]:ring-[3px]",
  ],
  {
    variants: {},
  },
);

/** One model row in the popup list — selected vs. disabled tone. */
export const modelSelectorItemVariants = cva(
  [
    "relative flex cursor-pointer select-none flex-col gap-0.5 rounded-sm px-2 py-1.5",
    "text-sm text-popover-foreground outline-none transition-colors",
    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "data-[selected]:font-medium",
  ],
  {
    variants: {},
  },
);
