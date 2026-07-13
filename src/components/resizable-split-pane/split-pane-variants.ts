/**
 * splitPaneVariants — pure CVA variant functions for MosaicResizableSplitPane.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root container — flex row hosting main pane, handle, side pane. */
export const splitPaneRootVariants = cva(["flex h-full w-full min-h-0"]);

/** Draggable resize handle between the two panes. */
export const splitPaneHandleVariants = cva([
  "relative w-1 shrink-0 cursor-col-resize touch-none select-none bg-border",
  "transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
]);

/** Collapse/expand toggle button, anchored next to the handle. */
export const splitPaneCollapseButtonVariants = cva([
  "inline-flex h-11 w-6 shrink-0 items-center justify-center self-center rounded-md border border-border text-sm",
  "transition-colors hover:bg-accent/50",
]);
