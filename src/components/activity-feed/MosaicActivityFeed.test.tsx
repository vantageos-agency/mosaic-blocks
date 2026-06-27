import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicActivityFeed } from "./MosaicActivityFeed.js";

const activities = [
  {
    id: "act-1",
    type: "debate",
    title: "Team Strategy Session",
    description: "Quarterly planning debate",
    timestamp: new Date().toISOString(),
    status: "active" as const,
    participants: ["Alice", "Bob"],
    messages: 12,
  },
  {
    id: "act-2",
    type: "review",
    title: "Code Review",
    timestamp: new Date().toISOString(),
    status: "completed" as const,
  },
];

describe("MosaicActivityFeed", () => {
  it("renders activity titles", () => {
    render(<MosaicActivityFeed activities={activities} />);
    expect(screen.getByText("Team Strategy Session")).toBeTruthy();
    expect(screen.getByText("Code Review")).toBeTruthy();
  });

  it("renders empty state when activities array is empty", () => {
    render(<MosaicActivityFeed activities={[]} />);
    expect(screen.getByText("No recent activity")).toBeTruthy();
  });

  it("renders status badge for each activity", () => {
    render(<MosaicActivityFeed activities={activities} />);
    // active / completed badges should appear
    const active = screen.getAllByText(/active/i);
    expect(active.length).toBeGreaterThan(0);
  });

  it("accepts custom className", () => {
    const { container } = render(
      <MosaicActivityFeed activities={activities} className="my-feed" />,
    );
    expect(container.querySelector(".my-feed")).toBeTruthy();
  });

  it("renders heading when provided", () => {
    render(<MosaicActivityFeed activities={activities} heading="Recent Activity" />);
    expect(screen.getByText("Recent Activity")).toBeTruthy();
  });
});
