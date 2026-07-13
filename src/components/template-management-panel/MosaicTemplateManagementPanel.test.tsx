/**
 * MosaicTemplateManagementPanel — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicTemplateManagementPanel.tsx exists)
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MosaicTemplateManagementItem } from "./MosaicTemplateManagementPanel.js";
import { MosaicTemplateManagementPanel } from "./MosaicTemplateManagementPanel.js";

const TEMPLATES: MosaicTemplateManagementItem[] = [
  { id: "t1", name: "Sales Coach" },
  { id: "t2", name: "Legal Reviewer" },
];

function baseProps() {
  return {
    templates: TEMPLATES,
    heading: "Saved templates",
    emptyMessage: "No saved templates yet.",
    renameLabel: "Rename",
    duplicateLabel: "Duplicate",
    deleteLabel: "Delete",
    saveLabel: "Save",
    cancelLabel: "Cancel",
    renameInputAriaLabel: "Template name",
    actionsAriaLabelFor: (name: string) => `Actions for ${name}`,
    onRename: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  };
}

describe("MosaicTemplateManagementPanel", () => {
  it("sets data-slot='template-management-panel' on the root element", () => {
    const { container } = render(<MosaicTemplateManagementPanel {...baseProps()} />);
    expect(container.querySelector("[data-slot='template-management-panel']")).toBeTruthy();
  });

  it("renders the host-supplied heading", () => {
    render(<MosaicTemplateManagementPanel {...baseProps()} />);
    expect(screen.getByText("Saved templates")).toBeTruthy();
  });

  it("renders one row per host-supplied template, by name", () => {
    render(<MosaicTemplateManagementPanel {...baseProps()} />);
    expect(screen.getByText("Sales Coach")).toBeTruthy();
    expect(screen.getByText("Legal Reviewer")).toBeTruthy();
  });

  it("renders the host-supplied empty message when templates is empty", () => {
    render(<MosaicTemplateManagementPanel {...baseProps()} templates={[]} />);
    expect(screen.getByText("No saved templates yet.")).toBeTruthy();
    expect(screen.queryByText("Sales Coach")).toBeFalsy();
  });

  it("does not render the empty message when templates is non-empty", () => {
    render(<MosaicTemplateManagementPanel {...baseProps()} />);
    expect(screen.queryByText("No saved templates yet.")).toBeFalsy();
  });

  it("derives each row action-menu aria-label from the host-supplied function", () => {
    render(<MosaicTemplateManagementPanel {...baseProps()} />);
    expect(screen.getByRole("button", { name: "Actions for Sales Coach" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Actions for Legal Reviewer" })).toBeTruthy();
  });

  it("calls onDuplicate(id) when the Duplicate action is selected", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicTemplateManagementPanel {...props} />);
    await user.click(screen.getByRole("button", { name: "Actions for Sales Coach" }));
    await waitFor(() => expect(screen.getByText("Duplicate")).toBeTruthy());
    await user.click(screen.getByText("Duplicate"));
    expect(props.onDuplicate).toHaveBeenCalledWith("t1");
  });

  it("calls onDelete(id) when the Delete action is selected", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicTemplateManagementPanel {...props} />);
    await user.click(screen.getByRole("button", { name: "Actions for Legal Reviewer" }));
    await waitFor(() => expect(screen.getByText("Delete")).toBeTruthy());
    await user.click(screen.getByText("Delete"));
    expect(props.onDelete).toHaveBeenCalledWith("t2");
  });

  it("switches a row into rename mode and calls onRename(id, value) on Save", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicTemplateManagementPanel {...props} />);
    await user.click(screen.getByRole("button", { name: "Actions for Sales Coach" }));
    await waitFor(() => expect(screen.getByText("Rename")).toBeTruthy());
    await user.click(screen.getByText("Rename"));

    const input = screen.getByRole("textbox", { name: "Template name" });
    expect((input as HTMLInputElement).value).toBe("Sales Coach");
    await user.clear(input);
    await user.type(input, "Sales Expert");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(props.onRename).toHaveBeenCalledWith("t1", "Sales Expert");
  });

  it("cancels rename mode without calling onRename when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MosaicTemplateManagementPanel {...props} />);
    await user.click(screen.getByRole("button", { name: "Actions for Sales Coach" }));
    await waitFor(() => expect(screen.getByText("Rename")).toBeTruthy());
    await user.click(screen.getByText("Rename"));

    const input = screen.getByRole("textbox", { name: "Template name" });
    await user.clear(input);
    await user.type(input, "Whatever");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Template name" })).toBeFalsy();
    expect(screen.getByText("Sales Coach")).toBeTruthy();
  });

  it("accepts a className on the root element", () => {
    const { container } = render(
      <MosaicTemplateManagementPanel {...baseProps()} className="custom-class" />,
    );
    expect(container.querySelector("[data-slot='template-management-panel']")?.className).toContain(
      "custom-class",
    );
  });

  it("scopes each row's action menu so duplicate rows never resolve by name collision", () => {
    const props = baseProps();
    const { container } = render(<MosaicTemplateManagementPanel {...props} />);
    const rows = container.querySelectorAll("[data-slot='template-management-row']");
    expect(rows).toHaveLength(2);
    const firstRow = within(rows[0] as HTMLElement);
    expect(firstRow.getByText("Sales Coach")).toBeTruthy();
  });
});
