/**
 * toolToggleListVariants — pure CVA variant functions for MosaicToolToggleList.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Section header container. */
export const toolToggleListSectionVariants = cva(["flex flex-col gap-2"], {
  variants: {},
});

/** One tool row — enabled vs. disabled tone. */
export const toolToggleListRowVariants = cva(
  [
    "flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
  ],
  {
    variants: {
      enabled: {
        true: "border-border bg-card",
        false: "border-border bg-card/50 opacity-70",
      },
    },
    defaultVariants: {
      enabled: true,
    },
  },
);
