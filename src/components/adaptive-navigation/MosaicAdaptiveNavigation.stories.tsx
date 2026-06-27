import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAdaptiveNavigation } from "./MosaicAdaptiveNavigation.js";

const items = [
  { id: "overview", title: "Overview", isComplete: true },
  { id: "agents", title: "Select Agents", duration: 30 },
  { id: "config", title: "Configuration" },
  { id: "review", title: "Review & Launch" },
];

function NavDemo() {
  const [active, setActive] = useState("agents");
  const [expanded, setExpanded] = useState(new Set<string>(["agents"]));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  return (
    <MosaicDeviceProvider>
      <MosaicAdaptiveNavigation
        items={items}
        activeItem={active}
        onItemChange={setActive}
        expandedItems={expanded}
        onToggleExpanded={toggle}
      />
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Layout/MosaicAdaptiveNavigation",
  component: MosaicAdaptiveNavigation,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicAdaptiveNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items, activeItem: "agents", onItemChange: () => {} },
  render: () => <NavDemo />,
};

export const AllComplete: Story = {
  args: {
    items: items.map((i) => ({ ...i, isComplete: true })),
    activeItem: "review",
    onItemChange: () => {},
  },
};
