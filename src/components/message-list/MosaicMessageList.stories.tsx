import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicMessageList } from "./MosaicMessageList.js";

const messages = [
  {
    id: "m1",
    content: "What should our primary strategic focus be this quarter?",
    sender: { id: "u1", name: "Alice Martin", type: "user" as const, accentColor: "bg-blue-500" },
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "m2",
    content:
      "Based on market signals, I recommend focusing on product-led growth and reducing churn through better onboarding.",
    sender: {
      id: "ai1",
      name: "Strategy Analyst",
      type: "ai" as const,
      accentColor: "bg-purple-500",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    reactions: { likes: 3 },
    replyCount: 2,
  },
  {
    id: "m3",
    content: "Can you elaborate on the onboarding improvements?",
    sender: { id: "u2", name: "Bob Chen", type: "user" as const, accentColor: "bg-green-500" },
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

const meta = {
  title: "Components/MosaicMessageList",
  component: MosaicMessageList,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="h-[500px]">
          <Story />
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    messages,
    title: "Discussion",
    onReply: (id) => console.log("reply", id),
    onReaction: (id, type) => console.log("react", id, type),
  },
};

export const Empty: Story = {
  args: {
    messages: [],
    title: "Messages",
  },
};

export const WithLoadMore: Story = {
  args: {
    messages,
    title: "Discussion",
    hasMore: true,
    onLoadMore: () => console.log("load more"),
  },
};
