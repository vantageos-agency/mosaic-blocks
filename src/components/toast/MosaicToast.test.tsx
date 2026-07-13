/**
 * MosaicToast + MosaicToastProvider — tests
 *
 * Coverage: renders for all 4 variants; required `title` always shown;
 * `onDismiss` fires on dismiss-button click AND on `durationMs` expiry;
 * `dismissAriaLabel` is the accessible name of the dismiss button; a11y role
 * is "alert" for the "error" variant and "status" for every other variant;
 * `MosaicToastProvider` positions its stack per the `position` prop
 * (data-slot + position-driven class), and defaults to "top-right" when
 * `position` is omitted.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MosaicToast, type MosaicToastVariant } from "./MosaicToast.js";
import { MosaicToastProvider } from "./MosaicToastProvider.js";

const VARIANTS: MosaicToastVariant[] = ["success", "error", "info", "warning"];

describe("MosaicToast", () => {
  it.each(VARIANTS)("renders the required title for variant=%s", (variant) => {
    render(
      <MosaicToast
        variant={variant}
        title={`Title for ${variant}`}
        onDismiss={vi.fn()}
        dismissAriaLabel="Dismiss"
      />,
    );
    expect(screen.getByText(`Title for ${variant}`)).toBeTruthy();
  });

  it("sets data-slot='toast' on the root", () => {
    const { container } = render(
      <MosaicToast variant="info" title="Saved" onDismiss={vi.fn()} dismissAriaLabel="Dismiss" />,
    );
    expect(container.querySelector("[data-slot='toast']")).toBeTruthy();
  });

  it("renders the optional description when provided", () => {
    render(
      <MosaicToast
        variant="success"
        title="Saved"
        description="Your changes were saved."
        onDismiss={vi.fn()}
        dismissAriaLabel="Dismiss"
      />,
    );
    expect(screen.getByText("Your changes were saved.")).toBeTruthy();
  });

  it("does not render a description region when description is omitted", () => {
    const { container } = render(
      <MosaicToast
        variant="success"
        title="Saved"
        onDismiss={vi.fn()}
        dismissAriaLabel="Dismiss"
      />,
    );
    expect(container.querySelector("[data-slot='toast-description']")).toBeNull();
  });

  it("renders the optional host-supplied action node", () => {
    render(
      <MosaicToast
        variant="info"
        title="Update available"
        action={<button type="button">Reload</button>}
        onDismiss={vi.fn()}
        dismissAriaLabel="Dismiss"
      />,
    );
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });

  it("renders the dismiss button with the required dismissAriaLabel as its accessible name", () => {
    render(
      <MosaicToast variant="info" title="Saved" onDismiss={vi.fn()} dismissAriaLabel="Fermer" />,
    );
    expect(screen.getByRole("button", { name: "Fermer" })).toBeTruthy();
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <MosaicToast variant="info" title="Saved" onDismiss={onDismiss} dismissAriaLabel="Fermer" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("applies the custom className to the root", () => {
    const { container } = render(
      <MosaicToast
        variant="info"
        title="Saved"
        onDismiss={vi.fn()}
        dismissAriaLabel="Fermer"
        className="my-extra-class"
      />,
    );
    expect(container.querySelector(".my-extra-class")).toBeTruthy();
  });

  describe("a11y role by variant", () => {
    it("uses role='alert' for the 'error' variant", () => {
      render(
        <MosaicToast
          variant="error"
          title="Failed"
          onDismiss={vi.fn()}
          dismissAriaLabel="Fermer"
        />,
      );
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    it.each(["success", "info", "warning"] as const)(
      "uses role='status' for the '%s' variant",
      (variant) => {
        render(
          <MosaicToast
            variant={variant}
            title="Saved"
            onDismiss={vi.fn()}
            dismissAriaLabel="Fermer"
          />,
        );
        expect(screen.getByRole("status")).toBeTruthy();
      },
    );
  });

  describe("durationMs auto-dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls onDismiss once durationMs has elapsed", () => {
      const onDismiss = vi.fn();
      render(
        <MosaicToast
          variant="info"
          title="Saved"
          onDismiss={onDismiss}
          dismissAriaLabel="Fermer"
          durationMs={3000}
        />,
      );
      expect(onDismiss).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2999);
      expect(onDismiss).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("never calls onDismiss on a timer when durationMs is omitted", () => {
      const onDismiss = vi.fn();
      render(
        <MosaicToast
          variant="info"
          title="Saved"
          onDismiss={onDismiss}
          dismissAriaLabel="Fermer"
        />,
      );
      vi.advanceTimersByTime(60_000);
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});

describe("MosaicToastProvider", () => {
  it("sets data-slot='toast-provider' on the root", () => {
    const { container } = render(
      <MosaicToastProvider>
        <div>toast stack</div>
      </MosaicToastProvider>,
    );
    expect(container.querySelector("[data-slot='toast-provider']")).toBeTruthy();
  });

  it("renders its children", () => {
    render(
      <MosaicToastProvider>
        <div data-testid="stack-child">a toast</div>
      </MosaicToastProvider>,
    );
    expect(screen.getByTestId("stack-child")).toBeTruthy();
  });

  it("defaults to 'top-right' positioning when position is omitted", () => {
    const { container } = render(
      <MosaicToastProvider>
        <div>toast</div>
      </MosaicToastProvider>,
    );
    const root = container.querySelector("[data-slot='toast-provider']");
    expect(root?.className).toContain("top-0");
    expect(root?.className).toContain("right-0");
  });

  it.each([
    ["top-right", "top-0"],
    ["top-center", "top-0"],
    ["bottom-right", "bottom-0"],
    ["bottom-center", "bottom-0"],
  ] as const)("applies the '%s' position class", (position, expectedClass) => {
    const { container } = render(
      <MosaicToastProvider position={position}>
        <div>toast</div>
      </MosaicToastProvider>,
    );
    const root = container.querySelector("[data-slot='toast-provider']");
    expect(root?.className).toContain(expectedClass);
  });
});
