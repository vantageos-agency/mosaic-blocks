/**
 * MosaicI18nProvider — RED-first tests (i18n foundation)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicI18nProvider } from "./MosaicI18nProvider.js";
import { useMosaicT } from "./useMosaicT.js";

afterEach(() => cleanup());

function Probe({ tKey }: { tKey: string }) {
  const t = useMosaicT();
  return <span>{t(tKey)}</span>;
}

describe("MosaicI18nProvider", () => {
  it("renders children", () => {
    render(
      <MosaicI18nProvider locale="en">
        <span>child</span>
      </MosaicI18nProvider>,
    );
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("provides the fr locale to descendant t()", () => {
    render(
      <MosaicI18nProvider locale="fr">
        <Probe tKey="Navbar.aria.main" />
      </MosaicI18nProvider>,
    );
    expect(screen.getByText("Navigation principale")).toBeTruthy();
  });

  it("provides the en locale to descendant t()", () => {
    render(
      <MosaicI18nProvider locale="en">
        <Probe tKey="Navbar.aria.main" />
      </MosaicI18nProvider>,
    );
    expect(screen.getByText("Main navigation")).toBeTruthy();
  });

  it("defaults locale to en when not specified", () => {
    render(
      <MosaicI18nProvider>
        <Probe tKey="Navbar.aria.main" />
      </MosaicI18nProvider>,
    );
    expect(screen.getByText("Main navigation")).toBeTruthy();
  });
});
