/**
 * agentBuilderModalVariants — pure CVA variant functions for
 * MosaicAgentBuilderModal.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React or
 * @base-ui/react (which live in MosaicAgentBuilderModal.tsx but not here).
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const agentBuilderModalPopupVariants = cva([
  "fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col",
  "-translate-x-1/2 -translate-y-1/2",
  "rounded-lg border border-border bg-background shadow-lg outline-none",
  "sm:max-w-lg",
]);

export const agentBuilderModalBackdropVariants = cva(["fixed inset-0 z-50 bg-black/50"]);
