/**
 * MosaicMatchInput — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicMatchInput.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicMatchInput } from "./MosaicMatchInput.js";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

const stateLabels = {
  exact: "Exact match",
  partial: "Partial match",
  ambiguous: "Ambiguous match",
  none: "No match",
};

describe("MosaicMatchInput", () => {
  it("renders the underlying combobox input", () => {
    render(
      <MosaicMatchInput
        items={items}
        matchState="none"
        stateLabels={stateLabels}
        emptyMessage="No results"
      />,
    );
    expect(screen.getByRole("combobox")).toBeTruthy();
  });

  it("renders the exact state label", () => {
    render(
      <MosaicMatchInput
        items={items}
        matchState="exact"
        stateLabels={stateLabels}
        emptyMessage="No results"
      />,
    );
    expect(screen.getByText("Exact match")).toBeTruthy();
  });

  it("renders the partial state label", () => {
    render(
      <MosaicMatchInput
        items={items}
        matchState="partial"
        stateLabels={stateLabels}
        emptyMessage="No results"
      />,
    );
    expect(screen.getByText("Partial match")).toBeTruthy();
  });

  it("NEGATIVE POLE: ambiguous state must NOT render identically to none state", () => {
    const { container: ambiguousContainer, unmount } = render(
      <MosaicMatchInput
        items={items}
        matchState="ambiguous"
        stateLabels={stateLabels}
        emptyMessage="No results"
      />,
    );
    const ambiguousStatus = screen.getByText("Ambiguous match");
    const ambiguousRole = ambiguousStatus.getAttribute("role");
    const ambiguousAccessibleText = ambiguousStatus.textContent;
    unmount();

    render(
      <MosaicMatchInput
        items={items}
        matchState="none"
        stateLabels={stateLabels}
        emptyMessage="No results"
      />,
    );
    const noneStatus = screen.getByText("No match");
    const noneRole = noneStatus.getAttribute("role");
    const noneAccessibleText = noneStatus.textContent;

    // The two states must differ on at least one accessible signal
    // (role and/or text) — ambiguous must warn the user distinctly from none.
    expect(ambiguousRole !== noneRole || ambiguousAccessibleText !== noneAccessibleText).toBe(true);
    expect(ambiguousContainer).toBeTruthy();
  });

  it("renders locked mode as a disabled/read-only input", () => {
    render(
      <MosaicMatchInput
        items={items}
        matchState="exact"
        stateLabels={stateLabels}
        emptyMessage="No results"
        locked
      />,
    );
    const input = screen.getByRole("combobox") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("sets data-slot='match-input' for composability", () => {
    const { container } = render(
      <MosaicMatchInput
        items={items}
        matchState="none"
        stateLabels={stateLabels}
        emptyMessage="No results"
      />,
    );
    expect(container.querySelector("[data-slot='match-input']")).toBeTruthy();
  });
});
