/**
 * drawerVariants — pure CVA variant functions for MosaicDrawer.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Popup panel — position + slide direction depend on `side`. */
export const drawerPopupVariants = cva(
  [
    "fixed z-50 flex flex-col bg-background shadow-xl outline-none",
    "transition-transform duration-200 ease-out",
    "data-[ending-style]:transition-none",
  ],
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-3/4 border-l border-border sm:max-w-sm",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-border sm:max-w-sm",
        top: "inset-x-0 top-0 max-h-[80vh] w-full border-b border-border",
        bottom: "inset-x-0 bottom-0 max-h-[80vh] w-full border-t border-border",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

/** Backdrop overlay behind the popup. */
export const drawerBackdropVariants = cva(["fixed inset-0 z-50 bg-black/50"]);
