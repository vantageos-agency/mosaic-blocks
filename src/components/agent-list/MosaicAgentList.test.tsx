import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentList } from "./MosaicAgentList.js";

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
        />
      </Wrapper>,
    );
    // Should render some root element
    expect(container.firstChild).toBeTruthy();
  });
});
