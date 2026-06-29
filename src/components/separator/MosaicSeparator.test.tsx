import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicSeparator } from "./MosaicSeparator.js";

describe("MosaicSeparator", () => {
  it("renders with role=separator", () => {
    render(<MosaicSeparator />);
    expect(screen.getByRole("separator")).toBeTruthy();
  });

  it("sets data-slot='separator' attribute", () => {
    render(<MosaicSeparator />);
    const el = screen.getByRole("separator");
    expect(el.getAttribute("data-slot")).toBe("separator");
  });

  it("applies horizontal classes by default", () => {
    render(<MosaicSeparator />);
    const el = screen.getByRole("separator");
    expect(el.className).toContain("h-px");
    expect(el.className).toContain("w-full");
  });

  it("applies vertical classes when orientation=vertical", () => {
    render(<MosaicSeparator orientation="vertical" />);
    const el = screen.getByRole("separator");
    expect(el.className).toContain("w-px");
  });
});
