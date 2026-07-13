import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicAgentPreview } from "./MosaicAgentPreview.js";

describe("MosaicAgentPreview — non-lying contract (compile-time)", () => {
  it("rejects a summary variant missing tagline (type-level, see @ts-expect-error above)", () => {
    // @ts-expect-error — "summary" variant requires tagline; the discriminated
    // union must reject this at compile time, never render an invented value.
    const el = <MosaicAgentPreview variant="summary" name="X" badgeLabel="Y" />;
    expect(el).toBeTruthy();
  });

  it("rejects a detailed variant missing attributes (type-level, see @ts-expect-error above)", () => {
    // @ts-expect-error — "detailed" variant requires attributes; the
    // discriminated union must reject this at compile time.
    const el = <MosaicAgentPreview variant="detailed" name="X" title="Y" />;
    expect(el).toBeTruthy();
  });

  it("rejects a summary variant carrying detailed-only props (type-level, see @ts-expect-error above)", () => {
    const el = (
      // @ts-expect-error — "summary" variant has no `attributes` field; a
      // variant must not leak the other variant's props.
      <MosaicAgentPreview variant="summary" name="X" tagline="Y" badgeLabel="Z" attributes={[]} />
    );
    expect(el).toBeTruthy();
  });
});

describe("MosaicAgentPreview — summary variant", () => {
  it("renders the agent name", () => {
    render(
      <MosaicAgentPreview
        variant="summary"
        name="StrategyBot"
        tagline="Analyst • Formal • Claude Sonnet"
        badgeLabel="Custom"
      />,
    );
    expect(screen.getByText("StrategyBot")).toBeTruthy();
  });

  it("renders the tagline exactly as given by the host", () => {
    render(
      <MosaicAgentPreview
        variant="summary"
        name="StrategyBot"
        tagline="Analyst • Formal • Claude Sonnet"
        badgeLabel="Custom"
      />,
    );
    expect(screen.getByText("Analyst • Formal • Claude Sonnet")).toBeTruthy();
  });

  it("renders the badge label exactly as given by the host", () => {
    render(
      <MosaicAgentPreview
        variant="summary"
        name="StrategyBot"
        tagline="Analyst • Formal • Claude Sonnet"
        badgeLabel="Custom"
      />,
    );
    expect(screen.getByText("Custom")).toBeTruthy();
  });

  it("does not render a Configuration Summary title in summary variant", () => {
    render(
      <MosaicAgentPreview
        variant="summary"
        name="StrategyBot"
        tagline="Analyst • Formal • Claude Sonnet"
        badgeLabel="Custom"
      />,
    );
    expect(screen.queryByText("Configuration Summary")).toBeNull();
  });

  it("sets data-slot=agent-preview on the root element", () => {
    const { container } = render(
      <MosaicAgentPreview
        variant="summary"
        name="StrategyBot"
        tagline="Analyst • Formal • Claude Sonnet"
        badgeLabel="Custom"
      />,
    );
    expect(container.querySelector('[data-slot="agent-preview"]')).toBeTruthy();
  });

  it("renders the empty name as given — never invents a fallback like 'Unnamed Agent'", () => {
    render(<MosaicAgentPreview variant="summary" name="" tagline="Analyst" badgeLabel="Custom" />);
    expect(screen.queryByText("Unnamed Agent")).toBeNull();
  });

  it("accepts a custom className on the root element", () => {
    const { container } = render(
      <MosaicAgentPreview
        variant="summary"
        name="StrategyBot"
        tagline="Analyst • Formal • Claude Sonnet"
        badgeLabel="Custom"
        className="my-preview"
      />,
    );
    expect(container.querySelector(".my-preview")).toBeTruthy();
  });
});

describe("MosaicAgentPreview — detailed variant", () => {
  const attributes = [
    { id: "role", label: "Role", value: "Strategist" },
    { id: "persona", label: "Personality", value: "Formal" },
    { id: "model", label: "Model", value: "Claude Sonnet" },
  ];

  it("renders the card title", () => {
    render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={attributes}
      />,
    );
    expect(screen.getByText("Configuration Summary")).toBeTruthy();
  });

  it("renders the agent name", () => {
    render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={attributes}
      />,
    );
    expect(screen.getByText("StrategyBot")).toBeTruthy();
  });

  it("renders every attribute label and value passed by the host", () => {
    render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={attributes}
      />,
    );
    expect(screen.getByText("Role")).toBeTruthy();
    expect(screen.getByText("Strategist")).toBeTruthy();
    expect(screen.getByText("Personality")).toBeTruthy();
    expect(screen.getByText("Formal")).toBeTruthy();
    expect(screen.getByText("Model")).toBeTruthy();
    expect(screen.getByText("Claude Sonnet")).toBeTruthy();
  });

  it("renders nothing for an attribute the host did not provide (no invented rows)", () => {
    render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={[{ id: "role", label: "Role", value: "Strategist" }]}
      />,
    );
    expect(screen.queryByText("Personality")).toBeNull();
    expect(screen.queryByText("Model")).toBeNull();
  });

  it("does not render a badge label in detailed variant (host did not pass one)", () => {
    render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={attributes}
      />,
    );
    expect(screen.queryByText("Custom")).toBeNull();
  });

  it("sets data-slot=agent-preview on the root element", () => {
    const { container } = render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={attributes}
      />,
    );
    expect(container.querySelector('[data-slot="agent-preview"]')).toBeTruthy();
  });

  it("never renders business text the host did not supply (no hardcoded labels)", () => {
    render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={attributes}
      />,
    );
    // None of these words exist anywhere in props above — if any of them
    // render, the component is baking in business knowledge (a fixed badge,
    // a fixed threshold label, a fixed recommendation) instead of only
    // showing what the host explicitly passed in.
    for (const bakedInWord of ["Recommended", "Popular", "Best match", "Featured"]) {
      expect(screen.queryByText(bakedInWord)).toBeNull();
    }
  });

  it("renders an empty attribute list without inventing placeholder rows", () => {
    const { container } = render(
      <MosaicAgentPreview
        variant="detailed"
        name="StrategyBot"
        title="Configuration Summary"
        attributes={[]}
      />,
    );
    expect(container.querySelectorAll('[data-slot="agent-preview-attribute"]').length).toBe(0);
  });
});
