import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeleteConfirmationDialog } from "./MosaicDeleteConfirmationDialog.js";

function Demo({ itemType = "agent", itemName = "Strategy Bot" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
        onClick={() => setOpen(true)}
      >
        Delete {itemType}
      </button>
      <MosaicDeleteConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          console.log("confirmed");
          setOpen(false);
        }}
        title={`Delete ${itemType}?`}
        description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
        cancelLabel="Cancel"
        confirmLabel={`Delete ${itemType}`}
      />
    </>
  );
}

const meta = {
  title: "Components/MosaicDeleteConfirmationDialog",
  component: MosaicDeleteConfirmationDialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicDeleteConfirmationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  open: false,
  onOpenChange: () => {},
  onConfirm: () => {},
  title: "Delete item?",
  description: 'Are you sure you want to delete "Item"? This action cannot be undone.',
  cancelLabel: "Cancel",
  confirmLabel: "Delete item",
} as const;

export const Default: Story = {
  args: baseArgs,
  render: () => <Demo />,
};

export const CustomLabels: Story = {
  args: baseArgs,
  render: () => <Demo itemType="template" itemName="My Custom Template" />,
};
