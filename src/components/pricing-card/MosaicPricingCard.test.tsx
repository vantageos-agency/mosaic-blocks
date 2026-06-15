/**
 * MosaicPricingCard — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicPricingCard } from "./MosaicPricingCard.js";

afterEach(() => cleanup());

describe("MosaicPricingCard", () => {
  const features = ["Feature one", "Feature two", "Feature three"];

  it("renders without crashing", () => {
    render(
      <MosaicPricingCard
        tier="Pro"
        price="$19/mo"
        features={features}
        cta={{ label: "Get started", href: "#" }}
      />,
    );
  });

  it("renders the tier name", () => {
    render(
      <MosaicPricingCard
        tier="Enterprise"
        price="$99/mo"
        features={features}
        cta={{ label: "Contact us", href: "#" }}
      />,
    );
    expect(screen.getByText("Enterprise")).toBeDefined();
  });

  it("renders the price", () => {
    render(
      <MosaicPricingCard
        tier="Pro"
        price="$49/mo"
        features={features}
        cta={{ label: "Start", href: "#" }}
      />,
    );
    expect(screen.getByText("$49/mo")).toBeDefined();
  });

  it("renders all features", () => {
    render(
      <MosaicPricingCard
        tier="Pro"
        price="$19/mo"
        features={features}
        cta={{ label: "Start", href: "#" }}
      />,
    );
    expect(screen.getByText("Feature one")).toBeDefined();
    expect(screen.getByText("Feature two")).toBeDefined();
    expect(screen.getByText("Feature three")).toBeDefined();
  });

  it("renders highlighted state when prop is true", () => {
    const { container } = render(
      <MosaicPricingCard
        tier="Pro"
        price="$19/mo"
        features={features}
        cta={{ label: "Start", href: "#" }}
        highlighted
      />,
    );
    expect(container.firstChild).toBeDefined();
  });
});
