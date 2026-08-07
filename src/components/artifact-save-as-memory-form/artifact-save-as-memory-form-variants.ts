/**
 * artifactSaveAsMemoryFormVariants — pure CVA variant functions for
 * MosaicArtifactSaveAsMemoryForm.
 *
 * Isolated in their own module so they can be re-exported from the
 * `@vantageos/mosaic-blocks/server` subpath without pulling in React.
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

/** Form vertical layout. */
export const artifactSaveAsMemoryFormRootVariants = cva(["flex flex-col gap-4"]);

/** Artifact preview card. */
export const artifactSaveAsMemoryFormPreviewVariants = cva([
  "flex items-start gap-3 rounded-md border border-border p-3",
]);

/** Field group (label + control + helper/error) vertical layout. */
export const artifactSaveAsMemoryFormFieldVariants = cva(["flex flex-col gap-1.5"]);

/** Field error text. */
export const artifactSaveAsMemoryFormErrorVariants = cva(["text-xs font-medium text-destructive"]);

/** Learning row (extracted insight + edit/remove actions). */
export const artifactSaveAsMemoryFormLearningVariants = cva([
  "flex items-start gap-2 rounded-md border border-border p-2",
]);

/** Footer action row. */
export const artifactSaveAsMemoryFormFooterVariants = cva([
  "flex items-center justify-end gap-3 border-t border-border pt-4",
]);

/** Save / cancel button variants by intent. */
export const artifactSaveAsMemoryFormButtonVariants = cva(
  [
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      intent: {
        cancel: "border border-border bg-background hover:bg-muted",
        save: "border border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "border border-transparent bg-transparent hover:bg-muted",
      },
    },
    defaultVariants: {
      intent: "cancel",
    },
  },
);
