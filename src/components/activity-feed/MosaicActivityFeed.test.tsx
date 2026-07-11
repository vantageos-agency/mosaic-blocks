import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicActivityFeed, MosaicActivityItem } from "./MosaicActivityFeed.js";

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
    render(
      <MosaicActivityFeed
        activities={activities}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("Team Strategy Session")).toBeTruthy();
    expect(screen.getByText("Code Review")).toBeTruthy();
  });

  it("renders empty state when activities array is empty", () => {
    render(
      <MosaicActivityFeed
        activities={[]}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("No recent activity")).toBeTruthy();
  });

  it("renders status badge for each activity", () => {
    render(
      <MosaicActivityFeed
        activities={activities}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    // active / completed badges should appear
    const active = screen.getAllByText(/active/i);
    expect(active.length).toBeGreaterThan(0);
  });

  it("accepts custom className", () => {
    const { container } = render(
      <MosaicActivityFeed
        activities={activities}
        heading="Recent Activity"
        emptyMessage="No recent activity"
        className="my-feed"
      />,
    );
    expect(container.querySelector(".my-feed")).toBeTruthy();
  });

  it("renders heading when provided", () => {
    render(
      <MosaicActivityFeed
        activities={activities}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("Recent Activity")).toBeTruthy();
  });

  // ── New shape tests (gap #3) ─────────────────────────────────────────────────

  it("accepts free-string status (not in MosaicActivityStatus enum)", () => {
    const item = {
      id: "vp-1",
      type: "task",
      title: "VP Free Status",
      timestamp: new Date().toISOString(),
      status: "pending", // not in enum
    };
    render(
      <MosaicActivityFeed
        activities={[item]}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("VP Free Status")).toBeTruthy();
    expect(screen.getByText("pending")).toBeTruthy();
  });

  it("accepts numeric timestamp (Unix ms)", () => {
    const ts = 1_700_000_000_000; // Nov 2023 epoch
    const item = {
      id: "vp-2",
      type: "task",
      title: "Numeric Timestamp",
      timestamp: ts,
      status: "active" as const,
    };
    render(
      <MosaicActivityFeed
        activities={[item]}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("Numeric Timestamp")).toBeTruthy();
    // The formatted date should be present (locale-dependent, just check non-empty)
    const slot = screen.getByText("Numeric Timestamp").closest('[data-slot="activity-item"]');
    expect(slot).toBeTruthy();
  });

  it("accepts structured participant { actor, excerpt }", () => {
    const item = {
      id: "vp-3",
      type: "task",
      title: "Structured Participant",
      timestamp: new Date().toISOString(),
      status: "active" as const,
      participants: [{ actor: "Kappa", excerpt: "merged PR #33" }],
    };
    render(
      <MosaicActivityFeed
        activities={[item]}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("Structured Participant")).toBeTruthy();
    // actor label rendered as initials
    expect(screen.getByLabelText("Kappa")).toBeTruthy();
  });

  it("renders excerpt field when provided", () => {
    const item = {
      id: "vp-4",
      type: "task",
      title: "With Excerpt",
      timestamp: new Date().toISOString(),
      status: "active" as const,
      excerpt: "Dashboard migration complete",
    };
    render(
      <MosaicActivityFeed
        activities={[item]}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByText("Dashboard migration complete")).toBeTruthy();
  });

  it("renders mixed participants — strings and objects coexist", () => {
    const item = {
      id: "vp-5",
      type: "task",
      title: "Mixed Participants",
      timestamp: new Date().toISOString(),
      status: "completed" as const,
      participants: ["Alice", { actor: "Bob", excerpt: "reviewed" }],
    };
    render(
      <MosaicActivityFeed
        activities={[item]}
        heading="Recent Activity"
        emptyMessage="No recent activity"
      />,
    );
    expect(screen.getByLabelText("Alice")).toBeTruthy();
    expect(screen.getByLabelText("Bob")).toBeTruthy();
  });

  it("MosaicActivityItem renders standalone with new shape", () => {
    const item = {
      id: "standalone-1",
      type: "task",
      title: "Standalone Item",
      timestamp: 1_700_000_000_000,
      status: "in_progress", // free string
      excerpt: "Some excerpt",
    };
    render(<MosaicActivityItem activity={item} />);
    expect(screen.getByText("Standalone Item")).toBeTruthy();
    expect(screen.getByText("in_progress")).toBeTruthy();
    expect(screen.getByText("Some excerpt")).toBeTruthy();
  });
});
