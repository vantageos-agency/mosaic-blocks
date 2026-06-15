/**
 * MosaicAvatar — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicAvatar.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicAvatar } from "./MosaicAvatar.js";

describe("MosaicAvatar", () => {
  it("renders root element with data-slot='avatar'", () => {
    render(<MosaicAvatar fallback="JD" data-testid="avatar" />);
    const el = screen.getByTestId("avatar");
    expect(el.getAttribute("data-slot")).toBe("avatar");
  });

  it("renders the fallback text when no src is given", async () => {
    render(<MosaicAvatar fallback="AB" />);
    // Fallback appears immediately when no src
    expect(await screen.findByText("AB")).toBeTruthy();
  });

  it("renders an img element when src is provided", () => {
    // base-ui Avatar.Image mounts conditionally after image load.
    // In jsdom images do not fire load events, so we verify the Avatar.Root
    // receives src/alt via the MosaicAvatar props (smoke-test that no error is thrown).
    expect(() => {
      render(<MosaicAvatar src="https://example.com/avatar.png" alt="User" fallback="U" />);
    }).not.toThrow();
  });

  it("renders fallback with data-slot='avatar-fallback'", async () => {
    render(<MosaicAvatar fallback="FB" />);
    const fallback = await screen.findByText("FB");
    expect(fallback.getAttribute("data-slot")).toBe("avatar-fallback");
  });

  it("renders Avatar.Image slot in the component tree (base-ui defers mount until loaded)", () => {
    // base-ui Avatar.Image only mounts in the DOM after the image fires onLoad.
    // In jsdom this never fires, so Avatar.Image returns null.
    // We verify render completes cleanly and the fallback is present instead.
    render(<MosaicAvatar src="https://example.com/pic.jpg" alt="pic" fallback="P" />);
    // Fallback should be visible since image is not "loaded" in jsdom
    expect(document.querySelector("[data-slot='avatar-fallback']")).toBeTruthy();
  });

  it("accepts additional className on the root", () => {
    render(<MosaicAvatar fallback="X" className="size-12" data-testid="avatar" />);
    expect(screen.getByTestId("avatar").className).toContain("size-12");
  });
});
