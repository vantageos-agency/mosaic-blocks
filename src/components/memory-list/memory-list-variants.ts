/**
 * memoryListVariants — pure CVA variant function for MosaicMemoryList.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/**
 * Root container layout — a single-column, divided row stack. Owns
 * disposition ONLY; item content is entirely host-supplied via `renderItem`.
 */
export const memoryListVariants = cva(["flex flex-col", "divide-y divide-border"], {
  variants: {
    density: {
      comfortable: "",
      compact: "",
    },
  },
  defaultVariants: {
    density: "comfortable",
  },
});

/**
 * Per-row wrapper — owns the row's vertical rhythm (density-dependent
 * padding). Isolated from `memoryListVariants` because it targets the
 * `<li>` wrapper, not the `<ul>` root.
 */
export const memoryListItemVariants = cva([], {
  variants: {
    density: {
      comfortable: "py-3",
      compact: "py-1",
    },
  },
  defaultVariants: {
    density: "comfortable",
  },
});
