import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicFilterSidebar } from "./MosaicFilterSidebar.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const filters = [
  { id: "all", label: "All", count: 12 },
  { id: "favorites", label: "Favorites", count: 3 },
];

const categories = [
  { id: "strategy", label: "Strategy", count: 5 },
  { id: "analysis", label: "Analysis", count: 7 },
];

describe("MosaicFilterSidebar", () => {
  it("renders filter tabs", () => {
    render(
      <Wrapper>
        <MosaicFilterSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="strategy"
          onCategoryChange={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Favorites")).toBeTruthy();
  });

  it("renders categories", () => {
    render(
      <Wrapper>
        <MosaicFilterSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="strategy"
          onCategoryChange={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Strategy")).toBeTruthy();
    expect(screen.getByText("Analysis")).toBeTruthy();
  });

  it("calls onFilterChange when filter clicked", async () => {
    const onFilterChange = vi.fn();
    render(
      <Wrapper>
        <MosaicFilterSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          filters={filters}
          selectedFilter="all"
          onFilterChange={onFilterChange}
          categories={[]}
          selectedCategory=""
          onCategoryChange={() => {}}
        />
      </Wrapper>,
    );
    await userEvent.click(screen.getByText("Favorites"));
    expect(onFilterChange).toHaveBeenCalledWith("favorites");
  });

  it("renders filter sidebar container", () => {
    // Toggle button only renders on desktop (!isMobile); jsdom defaults to mobile
    const { container } = render(
      <Wrapper>
        <MosaicFilterSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={[]}
          selectedCategory=""
          onCategoryChange={() => {}}
        />
      </Wrapper>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders optional title when provided", () => {
    render(
      <Wrapper>
        <MosaicFilterSidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          filters={[]}
          selectedFilter=""
          onFilterChange={() => {}}
          categories={[]}
          selectedCategory=""
          onCategoryChange={() => {}}
          title="Filters"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Filters")).toBeTruthy();
  });
});
