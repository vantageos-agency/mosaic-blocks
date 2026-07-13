/**
 * memoryGridVariants — pure CVA variant function for MosaicMemoryGrid.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/**
 * Root container layout — a responsive tile grid. Owns disposition ONLY;
 * item content is entirely host-supplied via `renderItem`.
 */
export const memoryGridVariants = cva(["grid", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"], {
  variants: {
    density: {
      comfortable: "gap-4",
      compact: "gap-2",
    },
  },
  defaultVariants: {
    density: "comfortable",
  },
});
