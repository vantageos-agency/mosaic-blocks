/**
 * MosaicFilterBar — unit tests
 *
 * RED-first TDD, following Button.test.tsx conventions.
 * Uses @testing-library/react + vitest.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicFilterBar } from "./MosaicFilterBar.js";

describe("MosaicFilterBar", () => {
  it("renders children", () => {
    render(
      <MosaicFilterBar>
        <span>Filter A</span>
        <span>Filter B</span>
      </MosaicFilterBar>,
    );
    expect(screen.getByText("Filter A")).toBeTruthy();
    expect(screen.getByText("Filter B")).toBeTruthy();
  });

  it("sets data-slot='filter-bar' on the root element", () => {
    const { container } = render(
      <MosaicFilterBar>
        <span>Child</span>
      </MosaicFilterBar>,
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("filter-bar");
  });

  it("renders label when provided", () => {
    render(
      <MosaicFilterBar label="Filtres">
        <span>Child</span>
      </MosaicFilterBar>,
    );
    expect(screen.getByText("Filtres")).toBeTruthy();
    expect(screen.getByText("Filtres").getAttribute("data-slot")).toBe("filter-bar-label");
  });

  it("does not render label slot when label is omitted", () => {
    render(
      <MosaicFilterBar>
        <span>Child</span>
      </MosaicFilterBar>,
    );
    expect(document.querySelector("[data-slot='filter-bar-label']")).toBeNull();
  });

  it("renders Clear button and fires onClearAll when provided", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    render(
      <MosaicFilterBar onClearAll={handleClear}>
        <span>Child</span>
      </MosaicFilterBar>,
    );
    const clearBtn = screen.getByRole("button", { name: "Clear" });
    expect(clearBtn).toBeTruthy();
    await user.click(clearBtn);
    expect(handleClear).toHaveBeenCalledOnce();
  });

  it("omits Clear button when onClearAll is absent", () => {
    render(
      <MosaicFilterBar>
        <span>Child</span>
      </MosaicFilterBar>,
    );
    expect(document.querySelector("[data-slot='filter-bar-clear']")).toBeNull();
  });

  it("renders custom clearLabel on the Clear button", () => {
    render(
      <MosaicFilterBar onClearAll={() => {}} clearLabel="Réinitialiser">
        <span>Child</span>
      </MosaicFilterBar>,
    );
    expect(screen.getByRole("button", { name: "Réinitialiser" })).toBeTruthy();
  });

  it("applies 'between' alignment class when align='between'", () => {
    const { container } = render(
      <MosaicFilterBar align="between">
        <span>Child</span>
      </MosaicFilterBar>,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("justify-between");
  });

  it("applies 'start' alignment class by default", () => {
    const { container } = render(
      <MosaicFilterBar>
        <span>Child</span>
      </MosaicFilterBar>,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("justify-start");
  });

  it("forwards extra className to the root element", () => {
    const { container } = render(
      <MosaicFilterBar className="my-4">
        <span>Child</span>
      </MosaicFilterBar>,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("my-4");
  });

  it("forwards ref to the root div element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <MosaicFilterBar ref={ref as React.RefObject<HTMLDivElement>}>
        <span>Child</span>
      </MosaicFilterBar>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("div");
  });
});
