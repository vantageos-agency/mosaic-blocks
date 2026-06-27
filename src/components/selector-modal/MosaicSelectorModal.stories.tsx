import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { type MosaicSelectorItem, MosaicSelectorModal } from "./MosaicSelectorModal.js";

const items = [
  { id: "i1", name: "Design Thinking", description: "Human-centered problem solving." },
  { id: "i2", name: "Lean Startup", description: "Build-Measure-Learn cycle." },
  {
    id: "i3",
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats.",
  },
  { id: "i4", name: "OKRs", description: "Objectives and Key Results framework." },
];

function SelectorDemo() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  return (
    <MosaicDeviceProvider>
      <div className="space-y-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          Select Frameworks
        </button>
        {selected && <p className="text-sm text-muted-foreground">Selected: {selected}</p>}
      </div>
      <MosaicSelectorModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Select Framework"
        items={items}
        selectedId={selected}
        onSelect={(item) => {
          setSelected(item.id);
          setOpen(false);
        }}
      />
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Components/MosaicSelectorModal",
  component: MosaicSelectorModal,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicSelectorModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseModalArgs = {
  isOpen: false as boolean,
  onClose: () => {},
  title: "Select",
  items: [] as MosaicSelectorItem[],
  onSelect: (_item: MosaicSelectorItem) => {},
};

export const Default: Story = {
  args: baseModalArgs,
  render: () => <SelectorDemo />,
};

export const PreSelected: Story = {
  args: baseModalArgs,
  render: () => {
    const [open, setOpen] = useState(true);
    const [selected, setSelected] = useState("i1");
    return (
      <MosaicDeviceProvider>
        <MosaicSelectorModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Select Framework"
          items={items}
          selectedId={selected}
          onSelect={(item) => setSelected(item.id)}
        />
      </MosaicDeviceProvider>
    );
  },
};
