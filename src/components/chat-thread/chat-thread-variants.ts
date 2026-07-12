/**
 * chatThreadVariants — pure CVA variant functions for MosaicChatThread.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Scrollable root container. */
export const chatThreadRootVariants = cva([
  "relative flex min-h-0 flex-1 flex-col overflow-y-auto",
]);

/** Inner content wrapper — centers and paces messages vertically. */
export const chatThreadContentVariants = cva([
  "mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6",
]);

/** "Scroll to bottom" floating button. */
export const chatThreadScrollButtonVariants = cva([
  "absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex size-9",
  "items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm",
  "transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
]);
