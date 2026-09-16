import type { Meta, StoryObj } from "@storybook/react";

import { MosaicSkeleton } from "./MosaicSkeleton.js";

const meta = {
  title: "Blocks/MosaicSkeleton",
  component: MosaicSkeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simulated loading state for a lease detail card — multi-line text skeleton.
export const ChargementFicheBail: Story = {
  name: "Chargement — fiche bail",
  args: {
    variant: "text",
    lines: 3,
    className: "w-80",
  },
};
