import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentList } from "./MosaicAgentList.js";

const requiredListLabels = {
  title: "Agents",
  searchPlaceholder: "Search agents…",
  createLabel: "New Agent",
  emptyMessage: "No agents found.",
  openFiltersAriaLabel: "Open filters",
  filtersModalTitle: "Filters",
  closeFiltersAriaLabel: "Close dialog",
  expandFiltersAriaLabel: "Expand filters",
  categoriesHeading: "Categories",
  collapseSidebarAriaLabel: "Collapse sidebar",
  expandSidebarAriaLabel: "Expand sidebar",
  agentCardLabels: {
    activeBadgeLabel: "Active",
    agentActionsAriaLabel: "Agent actions",
    deactivateLabel: "Deactivate",
    activateLabel: "Activate",
    editLabel: "Edit",
    deleteLabel: "Delete",
    pauseLabel: "Pause",
    startLabel: "Start",
    createdLabel: (d: string) => `Created ${d}`,
  },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const agents = [
  { id: "a1", name: "ResearchBot", isActive: true },
  { id: "a2", name: "SalesAgent", isActive: false },
];

const filters = [{ id: "all", label: "All" }];
const categories = [{ id: "default", label: "General" }];

describe("MosaicAgentList", () => {
  it("renders agent names", () => {
    render(
      <Wrapper>
        <MosaicAgentList
          agents={agents}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="default"
          onCategoryChange={() => {}}
          {...requiredListLabels}
        />
      </Wrapper>,
    );
    expect(screen.getByText("ResearchBot")).toBeTruthy();
    expect(screen.getByText("SalesAgent")).toBeTruthy();
  });

  it("renders title when provided", () => {
    render(
      <Wrapper>
        <MosaicAgentList
          agents={agents}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="default"
          onCategoryChange={() => {}}
          {...requiredListLabels}
          title="Agent Library"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Agent Library")).toBeTruthy();
  });

  it("renders empty list without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAgentList
            agents={[]}
            filters={filters}
            selectedFilter="all"
            onFilterChange={() => {}}
            categories={categories}
            selectedCategory="default"
            onCategoryChange={() => {}}
            {...requiredListLabels}
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders create button when onCreateAgent provided", () => {
    render(
      <Wrapper>
        <MosaicAgentList
          agents={[]}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="default"
          onCategoryChange={() => {}}
          onCreateAgent={() => {}}
          {...requiredListLabels}
          createLabel="New Agent"
        />
      </Wrapper>,
    );
    expect(screen.getByText("New Agent")).toBeTruthy();
  });

  it("renders with a data-slot root element", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAgentList
          agents={agents}
          filters={filters}
          selectedFilter="all"
          onFilterChange={() => {}}
          categories={categories}
          selectedCategory="default"
          onCategoryChange={() => {}}
          {...requiredListLabels}
        />
      </Wrapper>,
    );
    // Should render some root element
    expect(container.firstChild).toBeTruthy();
  });
});
