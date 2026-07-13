/**
 * agentChatVariants — pure CVA variant functions for MosaicAgentChat.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Root harness container — thread above, composer pinned below. */
export const agentChatRootVariants = cva([
  "flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card",
]);
