/**
 * MosaicHeroSplit — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicHeroSplit } from "./MosaicHeroSplit.js";

afterEach(() => cleanup());

describe("MosaicHeroSplit", () => {
  it("renders without crashing", () => {
    render(<MosaicHeroSplit title="Hero title" subtitle="Subtitle text" />);
  });

  it("renders the title", () => {
    render(<MosaicHeroSplit title="Build faster" subtitle="Ship more" />);
    expect(screen.getByText("Build faster")).toBeDefined();
  });

  it("renders subtitle", () => {
    render(<MosaicHeroSplit title="Build faster" subtitle="Ship more" />);
    expect(screen.getByText("Ship more")).toBeDefined();
  });

  it("renders eyebrow when provided", () => {
    render(<MosaicHeroSplit title="Build faster" subtitle="Ship more" eyebrow="New" />);
    expect(screen.getByText("New")).toBeDefined();
  });

  it("renders cta label when provided", () => {
    render(
      <MosaicHeroSplit
        title="Build faster"
        subtitle="Ship more"
        cta={{ label: "Start now", href: "#" }}
      />,
    );
    expect(screen.getByText("Start now")).toBeDefined();
  });
});
