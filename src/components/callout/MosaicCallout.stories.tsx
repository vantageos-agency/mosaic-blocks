import type { Meta, StoryObj } from "@storybook/react";

import { MosaicCallout } from "./MosaicCallout.js";

const meta: Meta<typeof MosaicCallout> = {
  title: "Components/MosaicCallout",
  component: MosaicCallout,
};

export default meta;
type Story = StoryObj<typeof MosaicCallout>;

export const Info: Story = {
  args: {
    variant: "info",
    title: "Heads up",
    children: "Supporting copy supplied by the host application.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Action required",
    children: "This notice uses role='alert' and is announced immediately.",
  },
};

export const TitleOnly: Story = {
  args: {
    variant: "info",
    title: "Nothing else to see here",
  },
};
