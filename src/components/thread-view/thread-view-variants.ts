/**
 * threadViewVariants — pure CVA variant functions for MosaicThreadView.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root container for the whole thread (root message + nested replies). */
export const threadViewRootVariants = cva(["flex min-w-0 flex-col gap-3"]);

/** Root-message region. */
export const threadViewRootMessageVariants = cva([
  "rounded-lg border border-border bg-card p-4 shadow-sm",
]);

/** Nested-replies list region. */
export const threadViewRepliesVariants = cva(["flex flex-col gap-2 border-border border-l-2 pl-4"]);

/** A single nested reply entry. */
export const threadViewReplyVariants = cva([
  "rounded-lg border border-border bg-muted/40 p-3 text-sm",
]);

/** Named empty-state paragraph, shown only when the host has zero replies to show. */
export const threadViewEmptyVariants = cva(["px-1 py-2 text-muted-foreground text-sm"]);
