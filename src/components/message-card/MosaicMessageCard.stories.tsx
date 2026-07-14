import type { Meta, StoryObj } from "@storybook/react";

import { MosaicMessageCard } from "./MosaicMessageCard.js";

const userMessage = {
  id: "msg-1",
  content: "What are the key strategic priorities we should focus on for the next quarter?",
  sender: { id: "u1", name: "Alice Martin", type: "user" as const, accentColor: "bg-blue-500" },
  timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  replyCount: 2,
};

const aiMessage = {
  id: "msg-2",
  content:
    "Based on the market analysis, I recommend focusing on three key areas: product differentiation, customer retention, and operational efficiency.",
  sender: {
    id: "ai1",
    name: "Strategy Analyst",
    type: "ai" as const,
    accentColor: "bg-purple-500",
  },
  timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  reactions: { likes: 5, dislikes: 1 },
  replyCount: 3,
};

const meta = {
  title: "Components/MosaicMessageCard",
  component: MosaicMessageCard,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicMessageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredMessageCardLabels = {
  replyLabel: "Reply",
  moreOptionsAriaLabel: "More options",
  removeBookmarkAriaLabel: "Remove bookmark",
  bookmarkAriaLabel: "Bookmark message",
  removeBookmarkLabel: "Remove bookmark",
  bookmarkLabel: "Bookmark",
  copyMessageLabel: "Copy message",
};

export const UserMessage: Story = {
  args: {
    message: userMessage,
    onReply: (id) => console.log("reply", id),
    ...requiredMessageCardLabels,
  },
};

export const AiMessage: Story = {
  args: {
    message: aiMessage,
    aiSenderLabel: "AI",
    onReply: (id) => console.log("reply", id),
    onReaction: (id, type) => console.log("react", id, type),
    ...requiredMessageCardLabels,
  },
};

export const Compact: Story = {
  args: {
    message: aiMessage,
    aiSenderLabel: "AI",
    compact: true,
    ...requiredMessageCardLabels,
  },
};
