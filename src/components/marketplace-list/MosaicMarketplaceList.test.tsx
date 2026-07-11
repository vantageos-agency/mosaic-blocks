import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicMarketplaceList } from "./MosaicMarketplaceList.js";

const requiredMarketplaceLabels = {
  previewLabel: "Preview",
  emptyMessage: "No items found.",
  openFiltersAriaLabel: "Open filters",
  filtersModalTitle: "Filters",
  closeFiltersAriaLabel: "Close dialog",
  expandFiltersAriaLabel: "Expand filters",
  categoriesHeading: "Categories",
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const items = [
  {
    id: "item-1",
    title: "Analytics Pro",
    description: "Advanced analytics plugin",
    category: "analytics",
    rating: 4.5,
    downloads: 1200,
    isInstalled: false,
  },
  {
    id: "item-2",
    title: "ChatBase",
    description: "Chat management tool",
    category: "communication",
    rating: 4.0,
    isInstalled: true,
  },
];

const filters = [{ id: "all", label: "All" }];
const categories = [{ id: "analytics", label: "Analytics" }];

describe("MosaicMarketplaceList", () => {
  it("renders marketplace item titles", () => {
    render(
      <Wrapper>
        <MosaicMarketplaceList
          items={items}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="analytics"
          onCategoryChange={() => {}}
          {...requiredMarketplaceLabels}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Analytics Pro")).toBeTruthy();
    expect(screen.getByText("ChatBase")).toBeTruthy();
  });

  it("renders with empty items without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicMarketplaceList
            items={[]}
            filters={filters}
            selectedFilter="all"
            onFilterChange={() => {}}
            categories={categories}
            selectedCategory="analytics"
            onCategoryChange={() => {}}
            {...requiredMarketplaceLabels}
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders item names (compact mode on mobile)", () => {
    // On mobile (jsdom default), descriptions are hidden (compact mode)
    // Item names are always visible
    render(
      <Wrapper>
        <MosaicMarketplaceList
          items={items}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="analytics"
          onCategoryChange={() => {}}
          {...requiredMarketplaceLabels}
        />
      </Wrapper>,
    );
    // In mobile compact mode, titles still render
    expect(screen.getAllByText("Analytics Pro").length).toBeGreaterThan(0);
  });

  it("renders in mobile compact mode without error", () => {
    const { container } = render(
      <Wrapper>
        <MosaicMarketplaceList
          items={items}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="analytics"
          onCategoryChange={() => {}}
          {...requiredMarketplaceLabels}
        />
      </Wrapper>,
    );
    // Some content renders
    expect(container.firstChild).toBeTruthy();
  });

  it("renders title when provided", () => {
    render(
      <Wrapper>
        <MosaicMarketplaceList
          items={items}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="analytics"
          onCategoryChange={() => {}}
          title="Marketplace"
          {...requiredMarketplaceLabels}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Marketplace")).toBeTruthy();
  });
});
