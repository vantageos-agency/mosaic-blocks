/**
 * MosaicNavbar — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicI18nProvider } from "../../i18n/MosaicI18nProvider.js";
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

  it("falls back to the bundled EN aria-label when no MosaicI18nProvider is mounted", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} />);
    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("Main navigation");
  });

  it("renders the FR aria-label under a fr MosaicI18nProvider", () => {
    render(
      <MosaicI18nProvider locale="fr">
        <MosaicNavbar logo={<span>Logo</span>} links={links} />
      </MosaicI18nProvider>,
    );
    expect(screen.getByRole("navigation").getAttribute("aria-label")).toBe("Navigation principale");
  });
});
