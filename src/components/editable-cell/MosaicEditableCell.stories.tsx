import type { Meta, StoryObj } from "@storybook/react";

import { MosaicEditableCell } from "./MosaicEditableCell.js";

const meta: Meta<typeof MosaicEditableCell> = {
  title: "Components/MosaicEditableCell",
  component: MosaicEditableCell,
};

export default meta;
type Story = StoryObj<typeof MosaicEditableCell>;

export const Default: Story = {
  args: {
    value: "Alpha",
    editAriaLabel: "Edit value",
    onCommit: (next) => console.log("commit", next),
  },
};

export const WithValidation: Story = {
  args: {
    value: "Alpha",
    editAriaLabel: "Edit value",
    validate: (next) => (next.trim().length < 2 ? "Must be at least 2 characters" : null),
    onCommit: (next) => console.log("commit", next),
  },
};

export const Disabled: Story = {
  args: {
    value: "Locked value",
    editAriaLabel: "Edit value",
    disabled: true,
    onCommit: (next) => console.log("commit", next),
  },
};
