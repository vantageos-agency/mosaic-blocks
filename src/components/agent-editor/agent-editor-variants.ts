/**
 * agent-editor-variants — cva variants for MosaicAgentEditor
 *
 * Separated per house convention (variants isolated from component logic).
 */

import { cva } from "class-variance-authority";

export const agentEditorVariants = cva("flex flex-col gap-4 w-full", {
  variants: {},
  defaultVariants: {},
});
