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

  // Every state below is rendered with the SAME label text on purpose.
  // If the test asserted on label text (or on a role||text disjunction),
  // it would pass regardless of what the component actually does — the
  // fixture would be saving a broken component. Distinguishing the
  // states must be entirely on the component's own DOM signal
  // (role + aria-live), which is what these tests assert directly.
  const sameLabelForAllStates = {
    exact: "SAME",
    partial: "SAME",
    ambiguous: "SAME",
    none: "SAME",
  };

  function renderIndicator(matchState: "exact" | "partial" | "ambiguous" | "none") {
    const { container, unmount } = render(
      <MosaicMatchInput
        items={items}
        matchState={matchState}
        stateLabels={sameLabelForAllStates}
        emptyMessage="No results"
      />,
    );
    const indicator = container.querySelector("[data-match-state]");
    if (!indicator) {
      throw new Error(`no [data-match-state] indicator rendered for matchState=${matchState}`);
    }
    const signal = {
      role: indicator.getAttribute("role"),
      ariaLive: indicator.getAttribute("aria-live"),
    };
    unmount();
    return signal;
  }

  it("NEGATIVE POLE: ambiguous must render a DOM signal distinct from none, even with an identical label", () => {
    const ambiguous = renderIndicator("ambiguous");
    const none = renderIndicator("none");

    expect(ambiguous.role !== none.role || ambiguous.ariaLive !== none.ariaLive).toBe(true);
  });

  it("NEGATIVE POLE: ambiguous must render a DOM signal distinct from partial, even with an identical label", () => {
    const ambiguous = renderIndicator("ambiguous");
    const partial = renderIndicator("partial");

    expect(ambiguous.role !== partial.role || ambiguous.ariaLive !== partial.ariaLive).toBe(true);
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
