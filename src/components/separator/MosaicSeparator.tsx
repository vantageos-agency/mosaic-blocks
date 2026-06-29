/**
 * MosaicSeparator — @base-ui/react Separator primitive
 *
 * A visual and semantic divider. Supports horizontal (default) and vertical orientations.
 * role=separator and aria attributes managed by the primitive automatically.
 *
 * data-slot="separator" on the rendered element.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Separator } from "@base-ui/react/separator";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicSeparatorProps extends Separator.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSeparator — production Separator atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/separator. Accessible separator with role="separator".
 * Supports horizontal and vertical orientations.
 *
 * @example
 * <MosaicSeparator />
 * <MosaicSeparator orientation="vertical" className="h-8" />
 */
export function MosaicSeparator({
  className,
  orientation = "horizontal",
  ref,
  ...props
}: MosaicSeparatorProps) {
  return (
    <Separator
      ref={ref}
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "h-full w-px" : "h-px w-full",
        className,
      )}
      {...props}
    />
  );
}

MosaicSeparator.displayName = "MosaicSeparator";
