import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAdaptiveGrid } from "./MosaicAdaptiveGrid.js";

const meta = {
  title: "Layout/MosaicAdaptiveGrid",
  component: MosaicAdaptiveGrid,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicAdaptiveGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

function SampleCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
      {label}
    </div>
  );
}

export const Default: Story = {
  args: {
    mobileColumns: 1,
    tabletColumns: 2,
    desktopColumns: 3,
    gap: "gap-4",
    children: (
      <>
        <SampleCard label="Cell 1" />
        <SampleCard label="Cell 2" />
        <SampleCard label="Cell 3" />
        <SampleCard label="Cell 4" />
        <SampleCard label="Cell 5" />
        <SampleCard label="Cell 6" />
      </>
    ),
  },
};

export const TwoColumns: Story = {
  args: {
    mobileColumns: 1,
    tabletColumns: 2,
    desktopColumns: 2,
    gap: "gap-6",
    children: (
      <>
        <SampleCard label="Left" />
        <SampleCard label="Right" />
      </>
    ),
  },
};
