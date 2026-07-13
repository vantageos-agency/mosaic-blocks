/**
 * chatSidebarThreadVariants — pure CVA variant function for
 * MosaicChatSidebar's per-thread row.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/**
 * Per-thread row — owns ONLY the active/inactive visual state. The row
 * never owns thread content; that is entirely host-supplied via
 * `renderThread`.
 */
export const chatSidebarThreadVariants = cva(
  ["w-full cursor-pointer rounded-md px-2 py-1.5 text-left transition-colors"],
  {
    variants: {
      active: {
        true: "bg-accent text-accent-foreground",
        false: "text-foreground hover:bg-muted",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
