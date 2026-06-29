/**
 * MosaicEmptyState — unit tests
 *
 * Pattern: Button.test.tsx (vitest + @testing-library/react)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicEmptyState } from "./MosaicEmptyState.js";

describe("MosaicEmptyState", () => {
  it("renders title", () => {
    render(<MosaicEmptyState title="No items" />);
    expect(screen.getByText("No items")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(<MosaicEmptyState title="Empty" description="Add your first item to get started." />);
    expect(screen.getByText("Add your first item to get started.")).toBeTruthy();
  });

  it("omits description when not provided", () => {
    render(<MosaicEmptyState title="Empty" />);
    expect(screen.queryByRole("paragraph")).toBeNull();
  });

  it("renders icon when provided", () => {
    render(<MosaicEmptyState title="No data" icon={<span data-testid="icon-node">icon</span>} />);
    expect(screen.getByTestId("icon-node")).toBeTruthy();
  });

  it("omits icon wrapper when icon not provided", () => {
    render(<MosaicEmptyState title="No icon" />);
    const root = screen.getByText("No icon").closest("[data-slot='empty-state']");
    expect(root?.querySelector("[data-slot='empty-state-icon']")).toBeNull();
  });

  it("renders action when provided", () => {
    render(<MosaicEmptyState title="Empty" action={<button type="button">Create item</button>} />);
    expect(screen.getByRole("button", { name: "Create item" })).toBeTruthy();
  });

  it("omits action wrapper when action not provided", () => {
    render(<MosaicEmptyState title="No action" />);
    const root = screen.getByText("No action").closest("[data-slot='empty-state']");
    expect(root?.querySelector("[data-slot='empty-state-action']")).toBeNull();
  });

  it("sets data-slot='empty-state' on root element", () => {
    render(<MosaicEmptyState title="Slot test" />);
    const root = screen.getByText("Slot test").closest("[data-slot='empty-state']");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-slot")).toBe("empty-state");
  });

  it("merges className onto root element", () => {
    render(<MosaicEmptyState title="Class test" className="custom-class" />);
    const root = screen.getByText("Class test").closest("[data-slot='empty-state']");
    expect(root?.className).toContain("custom-class");
  });

  it("renders title and description and action together", () => {
    render(
      <MosaicEmptyState
        title="Full state"
        description="Everything is here."
        icon={<span data-testid="full-icon">*</span>}
        action={<button type="button">Go</button>}
      />,
    );
    expect(screen.getByText("Full state")).toBeTruthy();
    expect(screen.getByText("Everything is here.")).toBeTruthy();
    expect(screen.getByTestId("full-icon")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go" })).toBeTruthy();
  });
});
