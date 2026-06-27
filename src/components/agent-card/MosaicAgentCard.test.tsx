import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicAgentCard } from "./MosaicAgentCard.js";

const agent = {
  id: "agent-1",
  name: "StrategyBot",
  description: "Strategic planning agent",
  type: "GPT-4",
  isActive: true,
  accentColor: "bg-blue-500",
  isEditable: true,
};

describe("MosaicAgentCard", () => {
  it("renders agent name", () => {
    render(<MosaicAgentCard agent={agent} />);
    expect(screen.getByText("StrategyBot")).toBeTruthy();
  });

  it("renders agent description", () => {
    render(<MosaicAgentCard agent={agent} />);
    expect(screen.getByText("Strategic planning agent")).toBeTruthy();
  });

  it("renders inactive agent correctly", () => {
    render(<MosaicAgentCard agent={{ ...agent, isActive: false }} />);
    expect(screen.getByText("StrategyBot")).toBeTruthy();
  });

  it("calls onToggleStatus when toggle button clicked", async () => {
    const onToggle = vi.fn();
    render(<MosaicAgentCard agent={agent} onToggleStatus={onToggle} />);
    // "Pause" button = direct toggle (agent is active)
    const pauseBtn = screen.getByRole("button", { name: /pause/i });
    await userEvent.click(pauseBtn);
    expect(onToggle).toHaveBeenCalledWith("agent-1");
  });

  it("accepts custom className", () => {
    const { container } = render(<MosaicAgentCard agent={agent} className="my-card" />);
    expect(container.querySelector(".my-card")).toBeTruthy();
  });
});
