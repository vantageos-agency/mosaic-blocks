/**
 * alertDialogContentVariants — pure CVA variant function for MosaicAlertDialog content.
 *
 * Isolated in its own module so it can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in
 * React or @base-ui/react (which live in MosaicAlertDialog.tsx but not here).
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const alertDialogContentVariants = cva([
  "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)]",
  "-translate-x-1/2 -translate-y-1/2 gap-4",
  "rounded-lg border border-border bg-background p-6 shadow-lg",
  "sm:max-w-lg",
]);

export const alertDialogOverlayVariants = cva(["fixed inset-0 z-50 bg-black/50"]);
