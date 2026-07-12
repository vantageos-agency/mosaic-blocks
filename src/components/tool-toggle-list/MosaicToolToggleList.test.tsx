/**
 * MosaicToolToggleList — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicToolToggleList.tsx exists)
 *
 * Differentiator vs. adam's AgentForm.svelte (closed 6-tool hardcoded
 * checkbox list, no approval level): here the tool catalogue AND the
 * approval-level catalogue are host-supplied DATA (props), never
 * hardcoded, and every row exposes both an enable/disable switch AND an
 * approval-level selector.
 *
 * Note: @base-ui/react Switch.Root dispatches `new ownerWindow(el).PointerEvent`
 * on pointer interactions. jsdom 24+ exposes PointerEvent globally but base-ui
 * reads it from ownerWindow — polyfill ensures click-path works in tests.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Polyfill PointerEvent on window for @base-ui/react Switch in jsdom
if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {}
  // @ts-expect-error -- jsdom polyfill: window.PointerEvent not present in all jsdom builds
  window.PointerEvent = PointerEventPolyfill;
}

import {
  MosaicToolToggleList,
  type MosaicToolToggleListApprovalLevel,
  type MosaicToolToggleListSection,
  type MosaicToolToggleListTool,
} from "./MosaicToolToggleList.js";

const approvalLevels: MosaicToolToggleListApprovalLevel[] = [
  { id: "never", label: "Never ask" },
  { id: "always", label: "Ask every call" },
  { id: "first", label: "Ask first time" },
];

const tools: MosaicToolToggleListTool[] = [
  {
    id: "send_message",
    name: "send_message",
    description: "Send a message to a peer orchestrator",
    enabled: true,
    approvalLevelId: "never",
  },
  {
    id: "check_messages",
    name: "check_messages",
    description: "Check incoming messages",
    enabled: false,
    approvalLevelId: "always",
  },
  {
    id: "web_search",
    name: "web_search",
    description: "Search the web",
    enabled: true,
    approvalLevelId: "first",
  },
];

const sections: MosaicToolToggleListSection[] = [
  { id: "teamwork", title: "Teamwork", toolIds: ["send_message", "check_messages"] },
  { id: "research", title: "Research", toolIds: ["web_search"] },
];

function baseProps() {
  return {
    sections,
    tools,
    approvalLevels,
    onToggleTool: vi.fn(),
    onChangeApproval: vi.fn(),
    toggleAriaLabel: (toolName: string) => `Toggle ${toolName}`,
    approvalSelectAriaLabel: (toolName: string) => `Approval level for ${toolName}`,
  };
}

describe("MosaicToolToggleList", () => {
  it("renders one row per tool, across sections", () => {
    render(<MosaicToolToggleList {...baseProps()} />);
    expect(screen.getByText("send_message")).toBeTruthy();
    expect(screen.getByText("check_messages")).toBeTruthy();
    expect(screen.getByText("web_search")).toBeTruthy();
  });

  it("renders each tool's description", () => {
    render(<MosaicToolToggleList {...baseProps()} />);
    expect(screen.getByText("Search the web")).toBeTruthy();
  });

  it("groups tools under host-supplied section titles", () => {
    render(<MosaicToolToggleList {...baseProps()} />);
    expect(screen.getByText("Teamwork")).toBeTruthy();
    expect(screen.getByText("Research")).toBeTruthy();
  });

  it("sets data-slot='tool-toggle-list' on the root element", () => {
    const { container } = render(<MosaicToolToggleList {...baseProps()} />);
    expect(container.querySelector("[data-slot='tool-toggle-list']")).toBeTruthy();
  });

  it("renders a switch per tool reflecting its enabled state", () => {
    render(<MosaicToolToggleList {...baseProps()} />);
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(3);
    const sendMessageSwitch = screen.getByRole("switch", { name: "Toggle send_message" });
    expect(sendMessageSwitch.getAttribute("aria-checked")).toBe("true");
    const checkMessagesSwitch = screen.getByRole("switch", { name: "Toggle check_messages" });
    expect(checkMessagesSwitch.getAttribute("aria-checked")).toBe("false");
  });

  it("calls onToggleTool(toolId, enabled) when a switch is activated", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicToolToggleList {...props} />);
    const sw = screen.getByRole("switch", { name: "Toggle check_messages" });
    sw.focus();
    await user.keyboard(" ");
    expect(props.onToggleTool).toHaveBeenCalledWith("check_messages", true);
  });

  it("renders host-supplied approval-level labels as combobox options", async () => {
    const user = userEvent.setup();
    render(<MosaicToolToggleList {...baseProps()} />);
    const trigger = screen.getByRole("combobox", { name: "Approval level for send_message" });
    await user.click(trigger);
    expect(screen.getByRole("option", { name: "Never ask" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Ask every call" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Ask first time" })).toBeTruthy();
  });

  it("calls onChangeApproval(toolId, levelId) when an approval option is selected", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicToolToggleList {...props} />);
    const trigger = screen.getByRole("combobox", { name: "Approval level for send_message" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Ask every call" }));
    expect(props.onChangeApproval).toHaveBeenCalledWith("send_message", "always");
  });

  it("accepts a className on the root element", () => {
    const { container } = render(
      <MosaicToolToggleList {...baseProps()} className="custom-class" />,
    );
    expect(container.querySelector("[data-slot='tool-toggle-list']")?.className).toContain(
      "custom-class",
    );
  });
});
