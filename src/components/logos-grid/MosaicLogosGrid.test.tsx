/**
 * MosaicLogosGrid — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicLogosGrid } from "./MosaicLogosGrid.js";

afterEach(() => cleanup());

describe("MosaicLogosGrid", () => {
  const logos = [
    { name: "Notion", src: "/logos/notion.svg" },
    { name: "Framer", src: "/logos/framer.svg" },
    { name: "Slack", src: "/logos/slack.svg" },
  ];

  it("renders without crashing", () => {
    render(<MosaicLogosGrid logos={logos} />);
  });

  it("renders all logo alt texts", () => {
    render(<MosaicLogosGrid logos={logos} />);
    expect(screen.getByAltText("Notion")).toBeDefined();
    expect(screen.getByAltText("Framer")).toBeDefined();
    expect(screen.getByAltText("Slack")).toBeDefined();
  });

  it("renders heading when provided", () => {
    render(<MosaicLogosGrid logos={logos} heading="Our partners" />);
    expect(screen.getByText("Our partners")).toBeDefined();
  });
});
