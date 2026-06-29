import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicProgress } from "./MosaicProgress.js";

describe("MosaicProgress", () => {
  it("renders with role=progressbar", () => {
    render(<MosaicProgress value={50} aria-label="Progress" />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("sets data-slot='progress' on root", () => {
    render(<MosaicProgress value={50} aria-label="Progress" />);
    const root = screen.getByRole("progressbar");
    expect(root.getAttribute("data-slot")).toBe("progress");
  });

  it("sets aria-valuenow from value prop", () => {
    render(<MosaicProgress value={75} aria-label="Progress" />);
    const root = screen.getByRole("progressbar");
    expect(root.getAttribute("aria-valuenow")).toBe("75");
  });
});
