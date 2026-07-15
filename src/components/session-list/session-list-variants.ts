/**
 * sessionListVariants — pure CVA variant function for MosaicSessionList.
 *
 * The source implementation shipped as FOUR separate list components, one
 * per disposition. Merged here into ONE component with a `layout` variant
 * prop — the doctrine used throughout this repo (see MosaicMemoryCard,
 * MosaicMemoryList): one component, variants, never N components for what
 * is really the same `items` + `renderItem` + `emptyMessage` contract with
 * a different container layout.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/**
 * Root container layout — owns disposition ONLY; item content is entirely
 * host-supplied via `renderItem`.
 */
export const sessionListVariants = cva([], {
  variants: {
    layout: {
      /** Single-column vertical stack, divided rows. */
      stack: "flex flex-col divide-y divide-border",
      /** Responsive tile grid. */
      grid: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
      /** Dense single-column stack — tighter row padding, no divider. */
      compact: "flex flex-col gap-1",
      /** Horizontal-scroll row of tiles. */
      inline: "flex flex-row gap-3 overflow-x-auto",
    },
  },
  defaultVariants: {
    layout: "stack",
  },
});

/** Per-item wrapper — spacing depends on the container layout. */
export const sessionListItemVariants = cva([], {
  variants: {
    layout: {
      stack: "py-3",
      grid: "",
      compact: "py-1",
      inline: "shrink-0",
    },
  },
  defaultVariants: {
    layout: "stack",
  },
});
