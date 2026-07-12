import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicMemoryCard } from "./MosaicMemoryCard.js";
import type { MosaicMemoryData } from "./MosaicMemoryCard.js";

const memory: MosaicMemoryData = {
  id: "mem-1",
  title: "Client prefers async updates",
  content: "The client explicitly asked to receive status updates via async written reports.",
  scope: "workspace",
  source: "manual",
  tags: ["client", "communication", "preference", "extra-tag"],
  createdAt: Date.now() - 5 * 60 * 1000,
  usageCount: 12,
};

const requiredLabels = {
  editLabel: "Edit",
  deleteLabel: "Delete",
  moreActionsLabel: "Memory actions",
  formatScope: (scope: MosaicMemoryData["scope"]) => scope,
  formatTimeAgo: () => "5m ago",
  formatUsageCount: (count: number) => `${count} uses`,
  formatMoreTags: (count: number) => `+${count}`,
};

describe("MosaicMemoryCard", () => {
  it("renders the memory title", () => {
    render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(screen.getByText("Client prefers async updates")).toBeTruthy();
  });

  it("defaults to the detailed variant", () => {
    const { container } = render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    const root = container.querySelector("[data-slot='memory-card']");
    expect(root?.getAttribute("data-variant")).toBe("detailed");
  });

  it("renders memory content in the detailed variant", () => {
    render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(screen.getByText(memory.content)).toBeTruthy();
  });

  it("renders only 3 tags plus an overflow badge in the detailed variant", () => {
    render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(screen.getByText("client")).toBeTruthy();
    expect(screen.getByText("communication")).toBeTruthy();
    expect(screen.getByText("preference")).toBeTruthy();
    expect(screen.queryByText("extra-tag")).toBeNull();
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("renders the usage count via formatUsageCount in the detailed variant", () => {
    render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(screen.getByText("12 uses")).toBeTruthy();
  });

  it("renders the time ago via formatTimeAgo", () => {
    render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(screen.getByText("5m ago")).toBeTruthy();
  });

  it("renders the scope via formatScope", () => {
    render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(screen.getByText("workspace")).toBeTruthy();
  });

  it("renders the compact variant without a tags row", () => {
    const { container } = render(
      <MosaicMemoryCard memory={memory} variant="compact" {...requiredLabels} />,
    );
    const root = container.querySelector("[data-slot='memory-card']");
    expect(root?.getAttribute("data-variant")).toBe("compact");
    expect(container.querySelector("[data-slot='memory-tags']")).toBeNull();
  });

  it("renders content truncated in the compact variant header", () => {
    render(<MosaicMemoryCard memory={memory} variant="compact" {...requiredLabels} />);
    expect(screen.getByText(memory.content)).toBeTruthy();
  });

  it("renders the usage count via formatUsageCount in the compact variant", () => {
    render(<MosaicMemoryCard memory={memory} variant="compact" {...requiredLabels} />);
    expect(screen.getByText("12 uses")).toBeTruthy();
  });

  it("calls formatUsageCount (not the raw number) in the compact variant", () => {
    const formatUsageCount = (count: number) => `USES:${count}`;
    render(
      <MosaicMemoryCard
        memory={memory}
        variant="compact"
        {...requiredLabels}
        formatUsageCount={formatUsageCount}
      />,
    );
    expect(screen.getByText("USES:12")).toBeTruthy();
    expect(screen.queryByText("12", { exact: true })).toBeNull();
  });

  it("opens the actions menu and calls onEdit", async () => {
    const onEdit = vi.fn();
    render(<MosaicMemoryCard memory={memory} onEdit={onEdit} {...requiredLabels} />);
    const trigger = screen.getByRole("button", { name: "Memory actions" });
    await userEvent.click(trigger);
    const editItem = screen.getByRole("menuitem", { name: "Edit" });
    await userEvent.click(editItem);
    expect(onEdit).toHaveBeenCalledWith(memory);
  });

  it("opens the actions menu and calls onDelete with the memory id", async () => {
    const onDelete = vi.fn();
    render(<MosaicMemoryCard memory={memory} onDelete={onDelete} {...requiredLabels} />);
    const trigger = screen.getByRole("button", { name: "Memory actions" });
    await userEvent.click(trigger);
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    await userEvent.click(deleteItem);
    expect(onDelete).toHaveBeenCalledWith("mem-1");
  });

  it("sets data-slot='memory-card' on the root", () => {
    const { container } = render(<MosaicMemoryCard memory={memory} {...requiredLabels} />);
    expect(container.querySelector("[data-slot='memory-card']")).toBeTruthy();
  });

  it("accepts a custom className", () => {
    const { container } = render(
      <MosaicMemoryCard memory={memory} className="my-memory-card" {...requiredLabels} />,
    );
    expect(container.querySelector(".my-memory-card")).toBeTruthy();
  });

  it("forwards a ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<MosaicMemoryCard memory={memory} ref={ref} {...requiredLabels} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
