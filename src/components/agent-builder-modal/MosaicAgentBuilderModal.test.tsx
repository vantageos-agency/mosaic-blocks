import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { MosaicAgentBuilderModal } from "./MosaicAgentBuilderModal.js";

function Harness({
  open,
  onOpenChange,
  onConfirm = vi.fn(),
  onCancel = vi.fn(),
  canConfirm = true,
  isConfirming = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  canConfirm?: boolean;
  isConfirming?: boolean;
}) {
  return (
    <div>
      <button type="button" data-testid="outside-trigger">
        Open agent builder
      </button>
      <MosaicAgentBuilderModal
        open={open}
        onOpenChange={onOpenChange}
        title="Configure agent"
        description="Set the fields for this agent."
        closeAriaLabel="Close"
        confirmLabel="Create agent"
        confirmingLabel="Creating…"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
        canConfirm={canConfirm}
        isConfirming={isConfirming}
      >
        <input data-testid="agent-name-field" defaultValue="" />
      </MosaicAgentBuilderModal>
    </div>
  );
}

describe("MosaicAgentBuilderModal", () => {
  it("renders nothing when open=false", () => {
    render(<Harness open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Configure agent")).toBeNull();
  });

  it("renders title, description and children (the host-owned agent config) when open=true", () => {
    render(<Harness open onOpenChange={() => {}} />);
    expect(screen.getByText("Configure agent")).toBeTruthy();
    expect(screen.getByText("Set the fields for this agent.")).toBeTruthy();
    expect(screen.getByTestId("agent-name-field")).toBeTruthy();
  });

  it("renders with data-slot='agent-builder-modal' on the popup root", () => {
    render(<Harness open onOpenChange={() => {}} />);
    expect(document.querySelector('[data-slot="agent-builder-modal"]')).toBeTruthy();
  });

  it("exposes role=dialog with aria-modal, aria-labelledby and aria-describedby wired", () => {
    render(<Harness open onOpenChange={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)?.textContent).toBe("Configure agent");
    expect(document.getElementById(describedBy as string)?.textContent).toBe(
      "Set the fields for this agent.",
    );
  });

  it("calls onConfirm when the confirm button is clicked and canConfirm is true", async () => {
    const onConfirm = vi.fn();
    render(<Harness open onOpenChange={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Create agent" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when canConfirm is false, and disables the confirm button", () => {
    const onConfirm = vi.fn();
    render(<Harness open onOpenChange={() => {}} onConfirm={onConfirm} canConfirm={false} />);
    const confirmBtn = screen.getByRole("button", { name: "Create agent" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    fireEvent.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not auto-close the modal on confirm — the host decides when to close", () => {
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Create agent" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows confirmingLabel and disables the confirm button while isConfirming is true", () => {
    render(<Harness open onOpenChange={() => {}} isConfirming />);
    const confirmBtn = screen.getByRole("button", { name: "Creating…" }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Create agent" })).toBeNull();
  });

  it("calls onCancel and closes the modal when the cancel button is clicked, without calling onConfirm", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Escape closes the modal via onOpenChange(false) and never calls onConfirm", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness open onOpenChange={onOpenChange} onConfirm={onConfirm} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("marks background content aria-hidden (inert) while the modal is open, and removes it on close", () => {
    const { rerender } = render(<Harness open onOpenChange={() => {}} />);
    let outside = screen.getByTestId("outside-trigger");
    expect(outside.closest('[aria-hidden="true"]')).toBeTruthy();
    rerender(<Harness open={false} onOpenChange={() => {}} />);
    outside = screen.getByTestId("outside-trigger");
    expect(outside.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("returns focus to the trigger element when the modal closes", () => {
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button type="button" data-testid="real-trigger" onClick={() => setOpen(true)}>
            Open
          </button>
          <MosaicAgentBuilderModal
            open={open}
            onOpenChange={setOpen}
            title="Configure agent"
            description="Set the fields for this agent."
            closeAriaLabel="Close"
            confirmLabel="Create agent"
            confirmingLabel="Creating…"
            cancelLabel="Cancel"
            onConfirm={() => {}}
            onCancel={() => setOpen(false)}
            canConfirm
            isConfirming={false}
          >
            <input data-testid="agent-name-field" defaultValue="" />
          </MosaicAgentBuilderModal>
        </div>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByTestId("real-trigger");
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.activeElement).toBe(trigger);
  });

  // ── Accessibility guarantees NOT provable under jsdom ──────────────────────
  //
  // SKIPPED, deliberately, and the reason matters more than the test.
  //
  // jsdom does not implement native Tab-key focus traversal, so any assertion
  // of the shape "Tab from the last element cycles back into the popup"
  // measures an accident of jsdom's node ordering, not the real focus trap —
  // it can pass on a developer machine and fail in CI. Both MosaicAlertDialog
  // and MosaicDrawer (the sibling components in this repo) hit the identical
  // wall and reached the identical verdict: skip it here, name why, and rely
  // on @base-ui/react's own audited test suite (a locked production
  // dependency) plus manual/Storybook keyboard QA for that guarantee. The
  // observable proxy for the trap IS covered above: the rest of the document
  // is marked aria-hidden while the modal is open.
  it.skip("traps focus inside the popup: Tab from the last element cycles back into the modal — NOT provable under jsdom", () => {
    // Intentionally left unimplemented — see comment above.
  });
});
