/**
 * MosaicBlurredOrb — RED-first tests
 * Contract: renders without crash; accepts color/size/position props
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicBlurredOrb } from "../components/blurred-orb/MosaicBlurredOrb.js";

describe("MosaicBlurredOrb", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicBlurredOrb />);
    unmount();
  });

  it("renders a decorative element", () => {
    const { container } = render(<MosaicBlurredOrb />);
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts colors, size, and position props", () => {
    const { container } = render(
      <MosaicBlurredOrb
        colors={["oklch(0.7 0.2 250)", "oklch(0.6 0.15 300)"]}
        size={400}
        position={{ top: "10%", left: "20%" }}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
