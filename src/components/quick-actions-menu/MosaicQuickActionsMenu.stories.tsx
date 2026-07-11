import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicQuickActionsMenu } from "./MosaicQuickActionsMenu.js";

const actions = [
  { id: "new-session", label: "New Session", onClick: () => console.log("new session") },
  { id: "new-agent", label: "New Agent", onClick: () => console.log("new agent") },
  { id: "new-template", label: "New Template", onClick: () => console.log("new template") },
  { id: "import", label: "Import", onClick: () => console.log("import"), separator: true },
];

const meta = {
  title: "Components/MosaicQuickActionsMenu",
  component: MosaicQuickActionsMenu,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicQuickActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    actions,
    label: "Quick Actions",
    menuTitle: "Quick Actions",
    emptyMessage: "No actions available.",
  },
};

export const IconOnly: Story = {
  args: {
    actions,
    label: "Quick Actions",
    menuTitle: "Actions",
    emptyMessage: "No actions available.",
  },
};
