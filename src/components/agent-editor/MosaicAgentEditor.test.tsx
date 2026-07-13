/**
 * MosaicAgentEditor — RED-first TDD
 *
 * Ported (shape only) from any-debate-ai components/agent-composer/AgentEditor.tsx
 * and components/agent-config/AgentBuilderModal.tsx. No business logic
 * (roles/personas/frameworks/models) is carried over — only the form shape:
 * name, role, instructions, save/cancel, host-controlled validation + busy state.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicAgentEditor } from "./MosaicAgentEditor.js";

function baseProps() {
  return {
    nameLabel: "Name",
    nameValue: "Atlas",
    onNameChange: vi.fn(),
    nameError: null as string | null,
    roleLabel: "Role",
    roleValue: "Analyst",
    onRoleChange: vi.fn(),
    roleError: null as string | null,
    instructionsLabel: "Instructions",
    instructionsValue: "Be concise.",
    onInstructionsChange: vi.fn(),
    instructionsError: null as string | null,
    saveLabel: "Save",
    cancelLabel: "Cancel",
    onSave: vi.fn(),
    onCancel: vi.fn(),
    canSave: true,
    isSaving: false,
    savingLabel: "Saving…",
  };
}

describe("MosaicAgentEditor", () => {
  it("sets data-slot='agent-editor' on the root element", () => {
    const { container } = render(<MosaicAgentEditor {...baseProps()} />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("agent-editor");
  });

  it("renders the name field with a label linked via htmlFor/id", () => {
    render(<MosaicAgentEditor {...baseProps()} />);
    const label = screen.getByText("Name");
    const input = screen.getByDisplayValue("Atlas");
    expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
    expect(input.getAttribute("id")).toBeTruthy();
  });

  it("renders the role field with a label linked via htmlFor/id", () => {
    render(<MosaicAgentEditor {...baseProps()} />);
    const label = screen.getByText("Role");
    const input = screen.getByDisplayValue("Analyst");
    expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
  });

  it("renders the instructions field with a label linked via htmlFor/id", () => {
    render(<MosaicAgentEditor {...baseProps()} />);
    const label = screen.getByText("Instructions");
    const textarea = screen.getByDisplayValue("Be concise.");
    expect(label.getAttribute("for")).toBe(textarea.getAttribute("id"));
  });

  it("calls onNameChange when the name field changes", () => {
    const props = baseProps();
    render(<MosaicAgentEditor {...props} />);
    const input = screen.getByDisplayValue("Atlas");
    fireEvent.change(input, { target: { value: "Nova" } });
    expect(props.onNameChange).toHaveBeenCalledWith("Nova");
  });

  it("calls onRoleChange when the role field changes", () => {
    const props = baseProps();
    render(<MosaicAgentEditor {...props} />);
    const input = screen.getByDisplayValue("Analyst");
    fireEvent.change(input, { target: { value: "Editor" } });
    expect(props.onRoleChange).toHaveBeenCalledWith("Editor");
  });

  it("calls onInstructionsChange when the instructions field changes", () => {
    const props = baseProps();
    render(<MosaicAgentEditor {...props} />);
    const textarea = screen.getByDisplayValue("Be concise.");
    fireEvent.change(textarea, { target: { value: "Be verbose." } });
    expect(props.onInstructionsChange).toHaveBeenCalledWith("Be verbose.");
  });

  it("does not render a name error when nameError is null", () => {
    render(<MosaicAgentEditor {...baseProps()} />);
    const input = screen.getByDisplayValue("Atlas");
    expect(input.getAttribute("aria-invalid")).not.toBe("true");
  });

  it("announces a name error via aria-invalid + aria-describedby when nameError is set", () => {
    const props = { ...baseProps(), nameError: "Name is required" };
    render(<MosaicAgentEditor {...props} />);
    const input = screen.getByDisplayValue("Atlas");
    const errorNode = screen.getByText("Name is required");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(errorNode.getAttribute("id")).toBe(describedBy);
  });

  it("announces a role error via aria-invalid + aria-describedby when roleError is set", () => {
    const props = { ...baseProps(), roleError: "Role is required" };
    render(<MosaicAgentEditor {...props} />);
    const input = screen.getByDisplayValue("Analyst");
    const errorNode = screen.getByText("Role is required");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(errorNode.getAttribute("id")).toBe(input.getAttribute("aria-describedby"));
  });

  it("announces an instructions error via aria-invalid + aria-describedby when instructionsError is set", () => {
    const props = { ...baseProps(), instructionsError: "Too long" };
    render(<MosaicAgentEditor {...props} />);
    const textarea = screen.getByDisplayValue("Be concise.");
    const errorNode = screen.getByText("Too long");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(errorNode.getAttribute("id")).toBe(textarea.getAttribute("aria-describedby"));
  });

  it("renders the save and cancel buttons with host-provided labels", () => {
    render(<MosaicAgentEditor {...baseProps()} />);
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("calls onSave when the save button is clicked and canSave is true", () => {
    const props = baseProps();
    render(<MosaicAgentEditor {...props} />);
    fireEvent.click(screen.getByText("Save"));
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const props = baseProps();
    render(<MosaicAgentEditor {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the save button when canSave is false", () => {
    const props = { ...baseProps(), canSave: false };
    render(<MosaicAgentEditor {...props} />);
    const button = screen.getByText("Save").closest("button");
    expect(button?.disabled).toBe(true);
  });

  it("does not call onSave when clicked while canSave is false", () => {
    const props = { ...baseProps(), canSave: false };
    render(<MosaicAgentEditor {...props} />);
    fireEvent.click(screen.getByText("Save"));
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("marks the form busy and disables save while isSaving is true, without a silent refusal", () => {
    const props = { ...baseProps(), isSaving: true };
    const { container } = render(<MosaicAgentEditor {...props} />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("aria-busy")).toBe("true");
    const button = screen.getByText("Saving…").closest("button");
    expect(button?.disabled).toBe(true);
  });

  it("does not call onSave when clicked while isSaving is true", () => {
    const props = { ...baseProps(), isSaving: true };
    render(<MosaicAgentEditor {...props} />);
    const button = screen.getByText("Saving…").closest("button");
    if (button) fireEvent.click(button);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("forwards className to the root element", () => {
    const { container } = render(<MosaicAgentEditor {...baseProps()} className="custom-editor" />);
    const root = container.firstElementChild;
    expect(root?.className).toContain("custom-editor");
  });
});
