/**
 * threadIndicatorVariants — pure CVA variant functions for MosaicThreadIndicator.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root button/trigger for the thread indicator. */
export const threadIndicatorRootVariants = cva([
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
  "hover:bg-accent hover:text-accent-foreground",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-60",
]);

/** Unread-count pill, shown only when the derived unread count is greater than zero. */
export const threadIndicatorCountVariants = cva([
  "inline-flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.5",
  "bg-primary text-primary-foreground text-[10px] font-semibold leading-none",
]);
