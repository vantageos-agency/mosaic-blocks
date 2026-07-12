import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeleteConfirmationDialog } from "./MosaicDeleteConfirmationDialog.js";

describe("MosaicDeleteConfirmationDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <MosaicDeleteConfirmationDialog
        open={false}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Delete item?"
        description='Are you sure you want to delete "Test Item"? This action cannot be undone.'
        cancelLabel="Cancel"
        confirmLabel="Delete item"
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
        title="Delete agent?"
        description='Are you sure you want to delete "My Agent"? This action cannot be undone.'
        cancelLabel="Cancel"
        confirmLabel="Delete agent"
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
        title="Are you absolutely sure?"
        description='Are you sure you want to delete "Item"? This action cannot be undone.'
        cancelLabel="Cancel"
        confirmLabel="Delete item"
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
        title="Delete agent?"
        description='Are you sure you want to delete "Agent X"? This action cannot be undone.'
        cancelLabel="Cancel"
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
        title="Delete agent?"
        description='Are you sure you want to delete "Agent X"? This action cannot be undone.'
        cancelLabel="Go back"
        confirmLabel="Delete agent"
      />,
    );
    expect(screen.getByRole("button", { name: /Go back/i })).toBeTruthy();
  });
});
