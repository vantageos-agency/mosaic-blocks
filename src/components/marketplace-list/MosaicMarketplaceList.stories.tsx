import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicMarketplaceList } from "./MosaicMarketplaceList.js";

const items = [
  {
    id: "i1",
    title: "Design Thinking Pro",
    description: "Full Design Thinking workflow with AI-powered empathy maps.",
    category: "Framework",
    rating: 4.8,
    downloads: 1200,
    isInstalled: false,
    tags: ["innovation", "ux"],
  },
  {
    id: "i2",
    title: "Lean Startup Toolkit",
    description: "Build-Measure-Learn accelerator with hypothesis tracking.",
    category: "Framework",
    rating: 4.6,
    downloads: 800,
    isInstalled: true,
    tags: ["startup", "agile"],
  },
  {
    id: "i3",
    title: "Competitive Intelligence",
    description: "Automated competitor tracking with market signal alerts.",
    category: "Research",
    rating: 4.2,
    downloads: 450,
    isInstalled: false,
    tags: ["research", "market"],
  },
];

const filters = [
  { id: "all", label: "All" },
  { id: "installed", label: "Installed" },
  { id: "free", label: "Free" },
];

const categories = [
  { id: "all", label: "All Categories" },
  { id: "framework", label: "Framework" },
  { id: "research", label: "Research" },
];

const meta = {
  title: "Components/MosaicMarketplaceList",
  component: MosaicMarketplaceList,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicMarketplaceList>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredMarketplaceLabels = {
  previewLabel: "Preview",
  emptyMessage: "No items found.",
  openFiltersAriaLabel: "Open filters",
  filtersModalTitle: "Filters",
  closeFiltersAriaLabel: "Close dialog",
  expandFiltersAriaLabel: "Expand filters",
  categoriesHeading: "Categories",
};

export const Default: Story = {
  args: {
    items,
    title: "Marketplace",
    filters,
    selectedFilter: "all",
    onFilterChange: (id) => console.log("filter", id),
    categories,
    selectedCategory: "all",
    onCategoryChange: (id) => console.log("category", id),
    onInstall: (id) => console.log("install", id),
    onUninstall: (id) => console.log("uninstall", id),
    ...requiredMarketplaceLabels,
  },
};

export const Empty: Story = {
  args: {
    items: [],
    title: "Marketplace",
    filters,
    selectedFilter: "all",
    onFilterChange: () => {},
    categories,
    selectedCategory: "all",
    onCategoryChange: () => {},
    ...requiredMarketplaceLabels,
  },
};
