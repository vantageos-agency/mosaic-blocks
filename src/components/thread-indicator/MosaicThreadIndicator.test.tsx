/**
 * MosaicThreadIndicator — tests
 *
 * Coverage: the rendered unread count is DERIVED from the host-supplied
 * `replies` array (never a number/word typed by the library), the indicator
 * disappears when the derived count is zero (absence-of-state, no fallback
 * word), the required label/ariaLabel props carry every user-facing string,
 * onActivate fires on click, disabled disables the trigger, and the
 * component performs zero network I/O.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MosaicThreadIndicator } from "./MosaicThreadIndicator.js";

const BASE_PROPS = {
  replies: [
    { id: "r1", unread: true },
    { id: "r2", unread: false },
    { id: "r3", unread: true },
  ],
  label: "Fil de discussion",
  ariaLabel: (count: number) => `Fil de discussion, ${count} réponses non lues`,
  onActivate: vi.fn(),
};

describe("MosaicThreadIndicator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets data-slot='thread-indicator' on the root", () => {
    const { container } = render(<MosaicThreadIndicator {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='thread-indicator']")).toBeTruthy();
  });

  it("derives the rendered unread count from the host-supplied replies array", () => {
    render(<MosaicThreadIndicator {...BASE_PROPS} />);
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("re-renders a different count when the host-supplied data changes (proves derivation, not a static value)", () => {
    const { rerender } = render(<MosaicThreadIndicator {...BASE_PROPS} />);
    expect(screen.getByText("2")).toBeTruthy();

    rerender(
      <MosaicThreadIndicator
        {...BASE_PROPS}
        replies={[
          { id: "r1", unread: true },
          { id: "r2", unread: true },
          { id: "r3", unread: true },
          { id: "r4", unread: true },
          { id: "r5", unread: false },
        ]}
      />,
    );
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.queryByText("2")).toBeNull();
  });

  it("renders the required label text", () => {
    render(<MosaicThreadIndicator {...BASE_PROPS} />);
    expect(screen.getByText("Fil de discussion")).toBeTruthy();
  });

  it("computes the accessible name from the host-supplied ariaLabel formatter with the derived count", () => {
    render(<MosaicThreadIndicator {...BASE_PROPS} />);
    expect(
      screen.getByRole("button", { name: "Fil de discussion, 2 réponses non lues" }),
    ).toBeTruthy();
  });

  it("does not render an unread-count pill when the derived count is zero (named absence-of-state, no fallback word)", () => {
    render(
      <MosaicThreadIndicator
        {...BASE_PROPS}
        replies={[
          { id: "r1", unread: false },
          { id: "r2", unread: false },
        ]}
      />,
    );
    expect(screen.queryByTestId("thread-indicator-count")).toBeNull();
  });

  it("treats a zero-length replies array the same way — no count pill rendered", () => {
    render(<MosaicThreadIndicator {...BASE_PROPS} replies={[]} />);
    expect(screen.queryByTestId("thread-indicator-count")).toBeNull();
  });

  it("calls onActivate when the trigger is clicked", () => {
    const onActivate = vi.fn();
    render(<MosaicThreadIndicator {...BASE_PROPS} onActivate={onActivate} />);
    fireEvent.click(screen.getByRole("button", { name: "Fil de discussion, 2 réponses non lues" }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("disables the trigger when disabled is true", () => {
    render(<MosaicThreadIndicator {...BASE_PROPS} disabled={true} />);
    expect(
      screen
        .getByRole("button", { name: "Fil de discussion, 2 réponses non lues" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("performs zero network I/O — fetch is never called", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<MosaicThreadIndicator {...BASE_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Fil de discussion, 2 réponses non lues" }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
