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

  it("renders a composed (rotating-words) title as its element tree, not as flattened text", () => {
    const { container } = render(
      <MosaicHeroSplit
        title={
          <span data-testid="composed-title">
            <span data-testid="word-active">Ship</span>
            <span data-testid="word-hidden" className="opacity-0">
              Build
            </span>
            <span data-testid="word-hidden-2" className="opacity-0">
              Launch
            </span>
          </span>
        }
        subtitle="Ship more"
      />,
    );
    const heading = container.querySelector("h1");
    expect(heading).not.toBeNull();
    // A component that stringified `title` would collapse this to one text node.
    expect(screen.getByTestId("word-active")).toBeDefined();
    expect(screen.getByTestId("word-hidden")).toBeDefined();
    expect(screen.getByTestId("word-hidden-2")).toBeDefined();
    expect(heading?.querySelectorAll("[data-testid^='word-']").length).toBe(3);
  });

  it("renders a free media node (non-image element tree) inside the section", () => {
    render(
      <MosaicHeroSplit
        title="Build faster"
        subtitle="Ship more"
        media={
          <div data-testid="terminal-mock">
            <pre data-testid="terminal-line">$ pnpm install</pre>
            <pre data-testid="terminal-line-2">$ pnpm build</pre>
          </div>
        }
      />,
    );
    expect(screen.getByTestId("terminal-mock")).toBeDefined();
    expect(screen.getByTestId("terminal-line")).toBeDefined();
    expect(screen.getByTestId("terminal-line-2")).toBeDefined();
  });

  it("renders composed title and free media simultaneously (consumer's combined case)", () => {
    render(
      <MosaicHeroSplit
        title={
          <span>
            <span data-testid="combo-word-active">Ship</span>
            <span data-testid="combo-word-hidden">Build</span>
          </span>
        }
        subtitle="Ship more"
        media={
          <div data-testid="combo-terminal-mock">
            <pre>$ pnpm dev</pre>
          </div>
        }
      />,
    );
    expect(screen.getByTestId("combo-word-active")).toBeDefined();
    expect(screen.getByTestId("combo-word-hidden")).toBeDefined();
    expect(screen.getByTestId("combo-terminal-mock")).toBeDefined();
  });

  it("non-regression: simple string title with no media renders unchanged — the row has exactly one column, no empty second column", () => {
    const { container } = render(
      <MosaicHeroSplit title="The platform built for modern teams" subtitle="Ship more" />,
    );
    expect(screen.getByText("The platform built for modern teams")).toBeDefined();
    // Identify the row structurally (the section's sole direct child div), never by
    // a cosmetic utility class — a class rename must not blind this assertion.
    const row = container.querySelector("section > div");
    expect(row).not.toBeNull();
    expect(row?.children.length).toBe(1);
  });

  it("with media provided, the row has exactly two columns and the second contains the media node", () => {
    const { container } = render(
      <MosaicHeroSplit
        title="The platform built for modern teams"
        subtitle="Ship more"
        media={<div data-testid="row-media-check">media</div>}
      />,
    );
    const row = container.querySelector("section > div");
    expect(row).not.toBeNull();
    expect(row?.children.length).toBe(2);
    expect(row?.children[1]?.querySelector("[data-testid='row-media-check']")).not.toBeNull();
  });
});
