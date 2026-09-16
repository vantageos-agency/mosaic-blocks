/**
 * MosaicTopBar — unit tests (vitest + @testing-library/react)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicTopBar } from "./MosaicTopBar.js";

describe("MosaicTopBar", () => {
  it("renders with data-slot='top-bar'", () => {
    const { container } = render(<MosaicTopBar />);
    expect(container.querySelector('[data-slot="top-bar"]')).toBeTruthy();
  });

  it("renders the searchSlot render-prop content", () => {
    render(<MosaicTopBar searchSlot={<input aria-label="Rechercher" />} />);
    expect(screen.getByLabelText("Rechercher")).toBeTruthy();
  });

  it("renders the themeControlSlot content", () => {
    render(<MosaicTopBar themeControlSlot={<button type="button">Theme</button>} />);
    expect(screen.getByText("Theme")).toBeTruthy();
  });

  it("renders the languageControlSlot content", () => {
    render(<MosaicTopBar languageControlSlot={<button type="button">FR</button>} />);
    expect(screen.getByText("FR")).toBeTruthy();
  });

  it("renders the titleSlot content", () => {
    render(<MosaicTopBar titleSlot={<h1>Tableau de bord</h1>} />);
    expect(screen.getByText("Tableau de bord")).toBeTruthy();
  });

  it("never bakes in its own search/theme/language logic — slots are pure render-props", () => {
    const { container } = render(<MosaicTopBar />);
    // No implicit input/button rendered when no slot is supplied.
    expect(container.querySelector("input")).toBeNull();
  });

  it("has displayName set", () => {
    expect(MosaicTopBar.displayName).toBe("MosaicTopBar");
  });

  it("floats above the page ground via an elevation token (not a border)", () => {
    const { container } = render(<MosaicTopBar />);
    const root = container.querySelector('[data-slot="top-bar"]') as HTMLElement;
    // Elevation is expressed as boxShadow (shadow + highlight edge), read via
    // the inline style attribute referencing the depth.css elevation tokens —
    // never a CSS `border`.
    expect(root.style.boxShadow).toContain("var(--mosaic-elevation-");
  });
});
