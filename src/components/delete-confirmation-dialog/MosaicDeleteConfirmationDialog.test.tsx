import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeleteConfirmationDialog } from "./MosaicDeleteConfirmationDialog.js";

describe("MosaicDeleteConfirmationDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <MosaicDeleteConfirmationDialog
        open={false}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        itemName="Test Item"
      />,
    );
    // Dialog content should not be visible
    expect(screen.queryByText("Test Item")).toBeNull();
  });

  it("renders item name when open", () => {
    render(
      <MosaicDeleteConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        itemName="My Agent"
      />,
    );
    expect(screen.getByText(/My Agent/)).toBeTruthy();
  });

  it("renders custom title when provided", () => {
    render(
      <MosaicDeleteConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        itemName="Item"
        title="Are you absolutely sure?"
      />,
    );
    expect(screen.getByText("Are you absolutely sure?")).toBeTruthy();
  });

  it("calls onConfirm when confirm button clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <MosaicDeleteConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={onConfirm}
        itemName="Agent X"
        confirmLabel="Delete"
      />,
    );
    const confirmBtn = screen.getByRole("button", { name: /Delete/i });
    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("renders cancel button with correct label", () => {
    render(
      <MosaicDeleteConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        itemName="Agent X"
        cancelLabel="Go back"
      />,
    );
    expect(screen.getByRole("button", { name: /Go back/i })).toBeTruthy();
  });
});
