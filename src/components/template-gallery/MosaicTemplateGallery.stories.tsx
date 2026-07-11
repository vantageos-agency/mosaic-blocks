import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import {
  MosaicAgentTeamPreview,
  MosaicQuickStartPanel,
  type MosaicTemplate,
  MosaicTemplateGallery,
} from "./MosaicTemplateGallery.js";

const templates: MosaicTemplate[] = [
  {
    id: "t1",
    name: "Strategy Sprint",
    description: "Rapid strategic planning session with competitive analysis.",
    category: "Strategy",
    type: "analysis",
    agents: [
      { id: "a1", name: "Strategist", accentColor: "bg-blue-500" },
      { id: "a2", name: "Analyst", accentColor: "bg-green-500" },
    ],
    metadata: { usageCount: 42 },
  },
  {
    id: "t2",
    name: "Innovation Lab",
    description: "Creative ideation powered by Design Thinking methodology.",
    category: "Innovation",
    type: "collaboration",
    agents: [
      { id: "a3", name: "Innovator", accentColor: "bg-purple-500" },
      { id: "a4", name: "Researcher", accentColor: "bg-yellow-500" },
    ],
    metadata: { usageCount: 15 },
  },
];

const filters = [
  { id: "all", label: "All" },
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Popular" },
];

const categories = [
  { id: "all", label: "All Categories" },
  { id: "strategy", label: "Strategy" },
  { id: "innovation", label: "Innovation" },
];

const presets = [
  { id: "p1", name: "Quick Strategy Session", description: "15-min strategy sprint" },
  { id: "p2", name: "Research Deep Dive", description: "30-min market analysis" },
];

const meta = {
  title: "Components/MosaicTemplateGallery",
  component: MosaicTemplateGallery,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicTemplateGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredGalleryLabels = {
  emptyMessage: "No templates found.",
  openFiltersAriaLabel: "Open filters",
  filtersTitle: "Filters",
  closeFiltersAriaLabel: "Close dialog",
  expandFiltersAriaLabel: "Expand filters",
  categoriesHeading: "Categories",
  previewLabel: "Preview",
  duplicateLabel: "Duplicate",
};

export const Default: Story = {
  args: {
    templates,
    title: "Template Gallery",
    filters,
    selectedFilter: "all",
    onFilterChange: (id) => console.log("filter", id),
    categories,
    selectedCategory: "all",
    onCategoryChange: (id) => console.log("category", id),
    onSelectTemplate: (t) => console.log("select", t.id),
    onPreviewTemplate: (t) => console.log("preview", t.id),
    ...requiredGalleryLabels,
  },
};

export const Empty: Story = {
  args: {
    templates: [],
    title: "Template Gallery",
    filters,
    selectedFilter: "all",
    onFilterChange: () => {},
    categories,
    selectedCategory: "all",
    onCategoryChange: () => {},
    onSelectTemplate: () => {},
    ...requiredGalleryLabels,
  },
};

export const QuickStart: Story = {
  args: {
    templates,
    selectedFilter: "all",
    onFilterChange: () => {},
    selectedCategory: "all",
    onCategoryChange: () => {},
    onSelectTemplate: () => {},
    ...requiredGalleryLabels,
  },
  render: () => (
    <MosaicDeviceProvider>
      <MosaicQuickStartPanel
        presets={presets}
        onSelectPreset={(preset) => console.log("preset", preset.id)}
        onSelectScenario={(s) => console.log("scenario", s.id)}
        presetsTitle="Quick Start"
      />
    </MosaicDeviceProvider>
  ),
};

export const AgentTeam: Story = {
  args: {
    templates,
    selectedFilter: "all",
    onFilterChange: () => {},
    selectedCategory: "all",
    onCategoryChange: () => {},
    onSelectTemplate: () => {},
    ...requiredGalleryLabels,
  },
  render: () => (
    <MosaicDeviceProvider>
      <MosaicAgentTeamPreview agents={templates[0].agents ?? []} label="Strategy Sprint Team" />
    </MosaicDeviceProvider>
  ),
};
