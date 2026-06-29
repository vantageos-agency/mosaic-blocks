import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicSlider } from "./MosaicSlider.js";

describe("MosaicSlider", () => {
  it("renders with role=slider", () => {
    render(<MosaicSlider defaultValue={50} aria-label="Volume" />);
    expect(screen.getByRole("slider")).toBeTruthy();
  });

  it("sets data-slot='slider' on root", () => {
    render(<MosaicSlider defaultValue={50} aria-label="Volume" />);
    expect(document.querySelector("[data-slot='slider']")).toBeTruthy();
  });

  it("sets aria-valuenow from defaultValue", () => {
    render(<MosaicSlider defaultValue={42} aria-label="Volume" />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("aria-valuenow")).toBe("42");
  });
});
