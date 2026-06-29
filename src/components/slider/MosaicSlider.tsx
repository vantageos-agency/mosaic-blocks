/**
 * MosaicSlider — @base-ui/react Slider primitive
 *
 * Builds on Slider.Root + Slider.Control + Slider.Track +
 * Slider.Indicator + Slider.Thumb.
 * Supports single value and range (array) values.
 * role=slider and aria-valuenow managed by the primitive automatically.
 *
 * data-slot="slider" on Root, "slider-track" on Track,
 * "slider-indicator" on Indicator, "slider-thumb" on Thumb.
 * Styling: Tailwind v4 semantic tokens only.
 */

import { Slider } from "@base-ui/react/slider";
import type * as React from "react";

// ── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MosaicSliderProps extends Slider.Root.Props {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSlider — production Slider atom for @vantageos/mosaic-blocks.
 *
 * Built on @base-ui/react/slider. Supports single value + range (array).
 * Keyboard accessible: arrow keys, Home, End.
 *
 * @example
 * <MosaicSlider defaultValue={50} aria-label="Volume" />
 * <MosaicSlider defaultValue={[20, 80]} aria-label="Price range" />
 */
export function MosaicSlider({ className, ref, ...props }: MosaicSliderProps) {
  const isRange = Array.isArray(props.defaultValue ?? props.value);
  const thumbCount = isRange ? ((props.defaultValue ?? props.value) as number[]).length : 1;

  return (
    <Slider.Root
      ref={ref}
      data-slot="slider"
      className={cn("w-full touch-none select-none", className)}
      {...props}
    >
      <Slider.Control className="flex items-center">
        <Slider.Track
          data-slot="slider-track"
          className="relative h-2 w-full grow rounded-full bg-secondary"
        >
          <Slider.Indicator
            data-slot="slider-indicator"
            className="absolute h-full rounded-full bg-foreground"
          />
          {Array.from({ length: thumbCount }).map((_, i) => (
            <Slider.Thumb
              // biome-ignore lint/suspicious/noArrayIndexKey: slider thumbs have stable positional identity
              key={i}
              data-slot="slider-thumb"
              className={cn(
                "block size-5 rounded-full",
                "border-2 border-foreground bg-background",
                "shadow-sm outline-none transition-colors",
                "focus-visible:ring-ring focus-visible:ring-[3px]",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
              )}
            />
          ))}
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

MosaicSlider.displayName = "MosaicSlider";
