import type { Meta, StoryObj } from "@storybook/react";

import { MosaicActivityFeed } from "./MosaicActivityFeed.js";

const activities = [
  {
    id: "act-1",
    type: "debate",
    title: "Strategy Workshop Q4",
    description: "Quarterly planning and goal alignment",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "active" as const,
    participants: ["Alice", "Bob", "Carol"],
    messages: 24,
  },
  {
    id: "act-2",
    type: "review",
    title: "Product Roadmap Review",
    description: "Evaluating priorities for the next release",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "completed" as const,
    participants: ["Dave", "Eve"],
    messages: 18,
  },
  {
    id: "act-3",
    type: "analysis",
    title: "Market Research Summary",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "archived" as const,
    messages: 7,
  },
];

const meta = {
  title: "Components/MosaicActivityFeed",
  component: MosaicActivityFeed,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicActivityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activities,
    heading: "Recent Activity",
    emptyMessage: "No recent activity",
  },
};

export const Empty: Story = {
  args: {
    activities: [],
    heading: "Recent Activity",
    emptyMessage: "No recent activity",
  },
};

export const WithViewAll: Story = {
  args: {
    activities,
    heading: "Recent Activity",
    emptyMessage: "No recent activity",
    viewAllHref: "/activity",
    viewAllLabel: "View All",
  },
};
