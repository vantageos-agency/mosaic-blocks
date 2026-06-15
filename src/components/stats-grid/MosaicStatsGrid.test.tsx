/**
 * MosaicStatsGrid — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicStatsGrid } from "./MosaicStatsGrid.js";

afterEach(() => cleanup());

describe("MosaicStatsGrid", () => {
  const stats = [
    { label: "Users", value: "10K+" },
    { label: "Uptime", value: "99.9%" },
    { label: "Countries", value: "50+" },
  ];

  it("renders without crashing", () => {
    render(<MosaicStatsGrid stats={stats} />);
  });

  it("renders all stat values", () => {
    render(<MosaicStatsGrid stats={stats} />);
    expect(screen.getByText("10K+")).toBeDefined();
    expect(screen.getByText("99.9%")).toBeDefined();
    expect(screen.getByText("50+")).toBeDefined();
  });

  it("renders all stat labels", () => {
    render(<MosaicStatsGrid stats={stats} />);
    expect(screen.getByText("Users")).toBeDefined();
    expect(screen.getByText("Uptime")).toBeDefined();
    expect(screen.getByText("Countries")).toBeDefined();
  });
});
