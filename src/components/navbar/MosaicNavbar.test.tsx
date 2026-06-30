/**
 * MosaicNavbar — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicNavbar } from "./MosaicNavbar.js";

afterEach(() => cleanup());

describe("MosaicNavbar", () => {
  const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ];

  it("renders without crashing", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} />);
  });

  it("renders provided nav links", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} />);
    expect(screen.getAllByText("Features").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pricing").length).toBeGreaterThan(0);
  });

  it("renders cta when provided", () => {
    render(
      <MosaicNavbar
        logo={<span>Logo</span>}
        links={links}
        cta={{ label: "Get started", href: "#start" }}
      />,
    );
    expect(screen.getAllByText("Get started").length).toBeGreaterThan(0);
  });

  // ── i18n: caller-overridable aria-labels ───────────────────────────────────

  it("uses navAriaLabel prop on <nav> when provided (FR override)", () => {
    render(
      <MosaicNavbar logo={<span>Logo</span>} links={links} navAriaLabel="Navigation principale" />,
    );
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeTruthy();
  });

  it("falls back to English default when navAriaLabel is omitted", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} />);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
  });

  it("uses openMenuAriaLabel prop on hamburger button when provided (FR override)", () => {
    render(
      <MosaicNavbar
        logo={<span>Logo</span>}
        links={links}
        openMenuAriaLabel="Ouvrir le menu"
        closeMenuAriaLabel="Fermer le menu"
      />,
    );
    expect(screen.getByRole("button", { name: "Ouvrir le menu" })).toBeTruthy();
  });

  it("falls back to English defaults on hamburger button when props omitted", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });
});
