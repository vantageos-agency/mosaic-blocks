/**
 * templateListVariants — pure CVA variant function for MosaicTemplateList.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/**
 * Root container layout — owns disposition ONLY (grid vs. single-column
 * list). The list never owns item content; item markup is entirely
 * host-supplied via `renderItem`.
 */
export const templateListVariants = cva(["grid gap-4"], {
  variants: {
    layout: {
      grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      list: "grid-cols-1",
    },
  },
  defaultVariants: {
    layout: "grid",
  },
});
