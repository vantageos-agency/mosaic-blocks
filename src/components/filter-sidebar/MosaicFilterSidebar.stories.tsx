import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicFilterSidebar } from "./MosaicFilterSidebar.js";

const filters = [
  { id: "all", label: "All", count: 24 },
  { id: "favorites", label: "Favorites", count: 5 },
  { id: "templates", label: "Templates", count: 12 },
];

const categories = [
  { id: "strategy", label: "Strategy", count: 8 },
  { id: "analysis", label: "Analysis", count: 6 },
  { id: "innovation", label: "Innovation", count: 5 },
  { id: "communication", label: "Communication", count: 5 },
];

function FilterDemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("strategy");
  return (
    <MosaicDeviceProvider>
      <div className="h-96 w-72">
        <MosaicFilterSidebar
          isCollapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          filters={filters}
          selectedFilter={filter}
          onFilterChange={setFilter}
          categories={categories}
          selectedCategory={category}
          onCategoryChange={setCategory}
          title="Filters"
          expandFiltersAriaLabel="Expand filters"
          categoriesHeading="Categories"
        />
      </div>
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Components/MosaicFilterSidebar",
  component: MosaicFilterSidebar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicFilterSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseFilterArgs = {
  isCollapsed: false,
  onToggleCollapse: () => {},
  selectedFilter: "all",
  onFilterChange: () => {},
  selectedCategory: "strategy",
  onCategoryChange: () => {},
  expandFiltersAriaLabel: "Expand filters",
  categoriesHeading: "Categories",
} as const;

export const Default: Story = {
  args: baseFilterArgs,
  render: () => <FilterDemo />,
};

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
    onToggleCollapse: () => {},
    filters,
    selectedFilter: "all",
    onFilterChange: () => {},
    categories,
    selectedCategory: "strategy",
    onCategoryChange: () => {},
    title: "Filters",
    expandFiltersAriaLabel: "Expand filters",
    categoriesHeading: "Categories",
  },
};
