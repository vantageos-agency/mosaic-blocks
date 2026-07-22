/**
 * MosaicCallout — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicCallout.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicCallout } from "./MosaicCallout.js";

describe("MosaicCallout", () => {
  it("renders the required title", () => {
    render(<MosaicCallout variant="info" title="Heads up" />);
    expect(screen.getByText("Heads up")).toBeTruthy();
  });

  it("renders children content", () => {
    render(
      <MosaicCallout variant="info" title="Heads up">
        Extra detail
      </MosaicCallout>,
    );
    expect(screen.getByText("Extra detail")).toBeTruthy();
  });

  it("uses role='status' for the info variant", () => {
    render(<MosaicCallout variant="info" title="Info title" />);
    expect(screen.getByRole("status").textContent).toContain("Info title");
  });

  it("uses role='alert' for the warning variant", () => {
    render(<MosaicCallout variant="warning" title="Warning title" />);
    expect(screen.getByRole("alert").textContent).toContain("Warning title");
  });

  it("sets data-slot='callout' for composability", () => {
    render(<MosaicCallout variant="info" title="Slotted" />);
    expect(screen.getByRole("status").getAttribute("data-slot")).toBe("callout");
  });

  it("renders a host-supplied icon", () => {
    render(
      <MosaicCallout variant="info" title="With icon" icon={<span data-testid="icon">i</span>} />,
    );
    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  it("accepts additional className", () => {
    render(<MosaicCallout variant="info" title="Classy" className="my-custom" />);
    expect(screen.getByRole("status").className).toContain("my-custom");
  });
});
