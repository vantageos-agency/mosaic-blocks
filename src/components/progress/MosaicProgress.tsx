/**
 * MosaicProgress — @base-ui/react Progress primitive
 *
 * Builds on Progress.Root + Progress.Track + Progress.Indicator.
 * Supports determinate (value prop) and indeterminate states.
 * aria-valuenow, aria-valuemin, aria-valuemax managed by the primitive.
 *
 * data-slot="progress" on Root, "progress-track" on Track, "progress-indicator" on Indicator.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Progress } from "@base-ui/react/progress";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicProgressProps extends Progress.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicProgress — production Progress atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/progress. Determinate and indeterminate modes.
 * Pass `value={null}` for indeterminate; pass `value={0–100}` for determinate.
 *
 * @example
 * <MosaicProgress value={60} />
 * <MosaicProgress value={null} aria-label="Loading…" />
 */
export function MosaicProgress({
  className,
  value,
  max = 100,
  ref,
  ...props
}: MosaicProgressProps) {
  return (
    <Progress.Root
      ref={ref}
      data-slot="progress"
      value={value}
      max={max}
      className={cn("w-full", className)}
      {...props}
    >
      <Progress.Track
        data-slot="progress-track"
        className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
      >
        <Progress.Indicator
          data-slot="progress-indicator"
          className="h-full w-full flex-1 rounded-full bg-foreground transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
        />
      </Progress.Track>
    </Progress.Root>
  );
}

MosaicProgress.displayName = "MosaicProgress";
