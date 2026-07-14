/**
 * memorySearchFilterChipVariants — pure CVA variant function for the
 * optional filter chips rendered by MosaicMemorySearch.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** One filter chip button — selected vs. unselected tone. */
export const memorySearchFilterChipVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "rounded-full border px-3 py-1 gap-1",
    "text-xs font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-[3px]",
  ],
  {
    variants: {
      selected: {
        true: "border-transparent bg-primary text-primary-foreground",
        false: "border-border bg-background text-foreground hover:bg-muted",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);
