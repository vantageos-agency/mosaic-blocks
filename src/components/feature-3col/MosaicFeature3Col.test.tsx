/**
 * MosaicFeature3Col — RED-first tests (T4 rescoped Option A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicFeature3Col } from "./MosaicFeature3Col.js";

afterEach(() => cleanup());

const sampleFeatures = [
  { id: "f1", title: "Speed", body: "Deploy in seconds." },
  { id: "f2", title: "Scale", body: "Handles millions of users." },
  { id: "f3", title: "Security", body: "Enterprise-grade by default." },
];

describe("MosaicFeature3Col", () => {
  it("renders heading when provided", () => {
    render(<MosaicFeature3Col heading="Core features" features={sampleFeatures} />);
    expect(screen.getByText("Core features")).toBeDefined();
  });

  it("renders subtext when provided", () => {
    render(
      <MosaicFeature3Col
        heading="Core features"
        subtext="Everything you need to ship."
        features={sampleFeatures}
      />,
    );
    expect(screen.getByText("Everything you need to ship.")).toBeDefined();
  });

  it("renders exactly N feature cells for N items", () => {
    render(<MosaicFeature3Col features={sampleFeatures} />);
    const cells = document.querySelectorAll('[data-slot="feature-3col-item"]');
    expect(cells.length).toBe(sampleFeatures.length);
  });

  it("renders feature titles and bodies", () => {
    render(<MosaicFeature3Col features={sampleFeatures} />);
    expect(screen.getByText("Speed")).toBeDefined();
    expect(screen.getByText("Deploy in seconds.")).toBeDefined();
    expect(screen.getByText("Scale")).toBeDefined();
    expect(screen.getByText("Handles millions of users.")).toBeDefined();
    expect(screen.getByText("Security")).toBeDefined();
    expect(screen.getByText("Enterprise-grade by default.")).toBeDefined();
  });

  it("renders icon slot when provided", () => {
    const features = [
      {
        id: "f1",
        title: "Speed",
        body: "Fast.",
        icon: <span data-testid="icon-speed">⚡</span>,
      },
    ];
    render(<MosaicFeature3Col features={features} />);
    expect(screen.getByTestId("icon-speed")).toBeDefined();
  });

  it("does not render icon wrapper when icon not provided", () => {
    render(<MosaicFeature3Col features={[{ id: "f1", title: "A", body: "B" }]} />);
    const iconWrappers = document.querySelectorAll('[data-slot="feature-3col-icon"]');
    expect(iconWrappers.length).toBe(0);
  });

  it("has data-slot=feature-3col on root section", () => {
    render(<MosaicFeature3Col features={sampleFeatures} />);
    const root = document.querySelector('[data-slot="feature-3col"]');
    expect(root).toBeDefined();
    expect(root?.tagName.toLowerCase()).toBe("section");
  });

  it("forwards ref to the root section element", () => {
    let capturedRef: HTMLElement | null = null;
    render(
      <MosaicFeature3Col
        features={sampleFeatures}
        ref={(el) => {
          capturedRef = el;
        }}
      />,
    );
    expect(capturedRef).not.toBeNull();
    expect((capturedRef as HTMLElement | null)?.tagName.toLowerCase()).toBe("section");
  });
});
