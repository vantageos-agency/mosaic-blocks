/**
 * MosaicFallingPattern — RED-first tests
 * Contract: renders without crash; accepts density/color props; aria-hidden
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicFallingPattern } from "../components/falling-pattern/MosaicFallingPattern.js";

describe("MosaicFallingPattern", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicFallingPattern />);
    unmount();
  });

  it("renders a decorative SVG/div", () => {
    const { container } = render(<MosaicFallingPattern />);
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts density and color props", () => {
    const { container } = render(<MosaicFallingPattern density={20} color="oklch(0.7 0.1 250)" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("is aria-hidden (purely decorative)", () => {
    const { container } = render(<MosaicFallingPattern />);
    const el = container.firstChild as Element;
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });
});
