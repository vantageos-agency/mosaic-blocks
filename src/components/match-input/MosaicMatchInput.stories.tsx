import type { Meta, StoryObj } from "@storybook/react";

import { MosaicMatchInput } from "./MosaicMatchInput.js";

const meta: Meta<typeof MosaicMatchInput> = {
  title: "Components/MosaicMatchInput",
  component: MosaicMatchInput,
};

export default meta;
type Story = StoryObj<typeof MosaicMatchInput>;

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

const stateLabels = {
  exact: "Exact match",
  partial: "Partial match",
  ambiguous: "Multiple candidates — pick one",
  none: "No match found",
};

export const Exact: Story = {
  args: { items, matchState: "exact", stateLabels, emptyMessage: "No results" },
};

export const Ambiguous: Story = {
  args: { items, matchState: "ambiguous", stateLabels, emptyMessage: "No results" },
};

export const None: Story = {
  args: { items, matchState: "none", stateLabels, emptyMessage: "No results" },
};

export const Locked: Story = {
  args: { items, matchState: "exact", stateLabels, emptyMessage: "No results", locked: true },
};
