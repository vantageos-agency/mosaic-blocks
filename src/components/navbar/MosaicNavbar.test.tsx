/**
 * MosaicNavbar — RED-first tests (T3-A Batch A)
 *
 * i18n pilot: aria-labels are host-owned, passed as REQUIRED props.
 * No English default/fallback lives in the component — these tests prove it
 * by asserting the FR strings win and the old English strings are absent.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicNavbar } from "./MosaicNavbar.js";

afterEach(() => cleanup());

describe("MosaicNavbar", () => {
  const links = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ];

  const requiredI18nProps = {
    navAriaLabel: "Navigation principale",
    openMenuAriaLabel: "Ouvrir le menu",
    closeMenuAriaLabel: "Fermer le menu",
  };

  it("renders without crashing", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} {...requiredI18nProps} />);
  });

  it("renders provided nav links", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} {...requiredI18nProps} />);
    expect(screen.getAllByText("Features").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pricing").length).toBeGreaterThan(0);
  });

  it("renders cta when provided", () => {
    render(
      <MosaicNavbar
        logo={<span>Logo</span>}
        links={links}
        cta={{ label: "Get started", href: "#start" }}
        {...requiredI18nProps}
      />,
    );
    expect(screen.getAllByText("Get started").length).toBeGreaterThan(0);
  });

  it("renders the host-provided navAriaLabel — host owns the language", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} {...requiredI18nProps} />);
    const nav = screen.getByRole("navigation");
    expect(nav.getAttribute("aria-label")).toBe("Navigation principale");
    expect(nav.getAttribute("aria-label")).not.toBe("Main navigation");
  });

  it("renders the host-provided openMenuAriaLabel on the closed hamburger button", () => {
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} {...requiredI18nProps} />);
    const button = screen.getByLabelText("Ouvrir le menu");
    expect(button).toBeTruthy();
    expect(screen.queryByLabelText("Open menu")).toBeNull();
  });

  it("renders the host-provided closeMenuAriaLabel once the menu is open", async () => {
    const user = userEvent.setup();
    render(<MosaicNavbar logo={<span>Logo</span>} links={links} {...requiredI18nProps} />);
    await user.click(screen.getByLabelText("Ouvrir le menu"));
    const button = screen.getByLabelText("Fermer le menu");
    expect(button).toBeTruthy();
    expect(screen.queryByLabelText("Close menu")).toBeNull();
  });
});

// ── i18n guard: zero hardcoded English left in source ────────────────────────

describe("i18n guard — no hardcoded English strings", () => {
  const dirName = dirname(fileURLToPath(import.meta.url));
  const attrPattern = /(aria-label|title|placeholder|alt)=(?!\{)"[A-Za-z][^"]*"/g;

  it("MosaicNavbar.tsx has zero hardcoded aria-label/title/placeholder/alt strings", () => {
    const source = readFileSync(join(dirName, "MosaicNavbar.tsx"), "utf-8");
    const codeOnly = stripComments(source);
    const matches = codeOnly.match(attrPattern) ?? [];
    expect(matches).toEqual([]);
  });
});

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}
