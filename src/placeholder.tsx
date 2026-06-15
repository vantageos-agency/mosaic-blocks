/**
 * Placeholder component — infra scaffold only.
 * Remove when T3/T4 lands real blocks.
 */

interface PlaceholderProps {
  label?: string;
}

export function Placeholder({ label = "mosaic-blocks placeholder" }: PlaceholderProps) {
  return <div data-mosaic-block="placeholder">{label}</div>;
}
