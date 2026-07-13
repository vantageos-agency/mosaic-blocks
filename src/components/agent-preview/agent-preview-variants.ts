/**
 * agentPreviewVariants — pure CVA variant function for MosaicAgentPreview.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const agentPreviewVariants = cva(["rounded-lg border border-border"], {
  variants: {
    variant: {
      summary: ["flex items-center gap-3 p-3 bg-background"],
      detailed: [],
    },
  },
  defaultVariants: {
    variant: "summary",
  },
});
