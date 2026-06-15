import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Placeholder } from "../placeholder.js";
import { version } from "../version.js";

describe("@vantageos/mosaic-blocks smoke", () => {
  it("exports a semver version string", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("renders Placeholder with default label", () => {
    render(<Placeholder />);
    expect(screen.getByText("mosaic-blocks placeholder")).toBeTruthy();
  });

  it("renders Placeholder with custom label", () => {
    render(<Placeholder label="T3 block here" />);
    expect(screen.getByText("T3 block here")).toBeTruthy();
  });
});
