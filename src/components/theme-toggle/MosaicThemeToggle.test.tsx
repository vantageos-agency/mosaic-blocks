/**
 * MosaicThemeToggle — unit tests (vitest + @testing-library/react)
 *
 * Wave-1 T5 reopen defect 3: the toggle used an arbitrary
 * `bg-[oklch(var(--mosaic-surface,1_0_0))]` value. `--mosaic-surface` (bare,
 * no suffix) is not a declared token anywhere in this package, so the
 * fallback `1 0 0` (solid white) always won — the button rendered a white
 * disc in BOTH themes, and its `currentColor` icon (white foreground in dark
 * mode) disappeared into it. These tests prove: (a) the icon element is
 * present and visible, (b) the background token used is never the SAME
 * token as the foreground/icon color, and (c) no literal OKLCH/arbitrary
 * color value remains in the component's className.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicThemeToggle } from "./MosaicThemeToggle.js";

describe("MosaicThemeToggle", () => {
  it("renders a visible icon element inside the button", () => {
    const { container } = render(
      <MosaicThemeToggle
        switchToLightLabel="Switch to light theme"
        switchToDarkLabel="Switch to dark theme"
      />,
    );
    const button = container.querySelector("button");
    const icon = button?.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  it("uses a background token that is NOT the same token as the icon's foreground color", () => {
    const { container } = render(
      <MosaicThemeToggle
        switchToLightLabel="Switch to light theme"
        switchToDarkLabel="Switch to dark theme"
      />,
    );
    const button = container.querySelector("button");
    const classes = button?.className ?? "";
    // The button must declare an explicit foreground (icon) color class...
    expect(classes).toMatch(/text-foreground/);
    // ...and a background utility that is a real semantic slot, never the
    // bare `bg-foreground` token (which would make the icon invisible on
    // its own background).
    expect(classes).not.toMatch(/bg-foreground\b/);
    expect(classes).toMatch(/bg-(secondary|muted|card|accent)\b/);
  });

  it("never ships a literal/arbitrary OKLCH color value in its className", () => {
    const { container } = render(
      <MosaicThemeToggle
        switchToLightLabel="Switch to light theme"
        switchToDarkLabel="Switch to dark theme"
      />,
    );
    const button = container.querySelector("button");
    expect(button?.className ?? "").not.toMatch(/oklch\(/);
  });

  it("has displayName set", () => {
    expect(MosaicThemeToggle.displayName).toBe("MosaicThemeToggle");
  });
});
