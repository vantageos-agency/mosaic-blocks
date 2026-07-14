import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import {
  MosaicAgentTeamPreview,
  MosaicQuickStartPanel,
  MosaicTemplateCard,
  MosaicTemplateGallery,
  MosaicTemplatePreview,
} from "./MosaicTemplateGallery.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const templates = [
  {
    id: "t1",
    name: "Strategy Debate",
    description: "A structured strategy discussion",
    category: "strategy",
    type: "debate",
    agents: [{ id: "a1", name: "Moderator", type: "GPT-4" }],
  },
  {
    id: "t2",
    name: "Innovation Workshop",
    description: "Creative ideation template",
    category: "innovation",
    type: "collaboration",
  },
];

const galleryBaseProps = {
  selectedFilter: "all",
  onFilterChange: () => {},
  selectedCategory: "all",
  onCategoryChange: () => {},
  emptyMessage: "No templates found.",
  openFiltersAriaLabel: "Open filters",
  filtersTitle: "Filters",
  closeFiltersAriaLabel: "Close dialog",
  expandFiltersAriaLabel: "Expand filters",
  categoriesHeading: "Categories",
  collapseSidebarAriaLabel: "Collapse sidebar",
  expandSidebarAriaLabel: "Expand sidebar",
  previewLabel: "Preview",
  duplicateLabel: "Duplicate",
};

const templateCardLabels = {
  previewLabel: "Preview",
  duplicateLabel: "Duplicate",
};

describe("MosaicTemplateGallery", () => {
  it("renders template names", () => {
    render(
      <Wrapper>
        <MosaicTemplateGallery
          templates={templates}
          onSelectTemplate={() => {}}
          {...galleryBaseProps}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Strategy Debate")).toBeTruthy();
    expect(screen.getByText("Innovation Workshop")).toBeTruthy();
  });

  it("renders empty state without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicTemplateGallery templates={[]} onSelectTemplate={() => {}} {...galleryBaseProps} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders with title when provided", () => {
    render(
      <Wrapper>
        <MosaicTemplateGallery
          templates={templates}
          onSelectTemplate={() => {}}
          {...galleryBaseProps}
          title="Template Library"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Template Library")).toBeTruthy();
  });
});

describe("MosaicTemplateCard", () => {
  it("renders template name", () => {
    render(
      <MosaicTemplateCard template={templates[0]} onSelect={() => {}} {...templateCardLabels} />,
    );
    expect(screen.getByText("Strategy Debate")).toBeTruthy();
  });

  it("renders template description", () => {
    render(
      <MosaicTemplateCard template={templates[0]} onSelect={() => {}} {...templateCardLabels} />,
    );
    expect(screen.getByText("A structured strategy discussion")).toBeTruthy();
  });
});

describe("MosaicTemplatePreview", () => {
  it("renders template name in preview", () => {
    render(
      <MosaicTemplatePreview
        template={templates[0]}
        onSelect={() => {}}
        onClose={() => {}}
        cancelLabel="Cancel"
        selectLabel="Use Template"
      />,
    );
    expect(screen.getByText("Strategy Debate")).toBeTruthy();
  });

  it("does not render an agents heading when formatAgentsHeading is absent", () => {
    render(
      <MosaicTemplatePreview
        template={templates[0]}
        onSelect={() => {}}
        onClose={() => {}}
        cancelLabel="Cancel"
        selectLabel="Use Template"
      />,
    );
    expect(screen.queryByText(/agents/i)).toBeNull();
  });

  it("renders the host-formatted agents heading when supplied", () => {
    render(
      <MosaicTemplatePreview
        template={templates[0]}
        onSelect={() => {}}
        onClose={() => {}}
        cancelLabel="Cancel"
        selectLabel="Use Template"
        formatAgentsHeading={(count) => `Agents (${count})`}
      />,
    );
    expect(screen.getByText("Agents (1)")).toBeTruthy();
  });
});

describe("MosaicQuickStartPanel", () => {
  it("renders without crashing", () => {
    const scenarios = [{ id: "s1", title: "Quick Start", description: "Get started fast" }];
    expect(() =>
      render(
        <MosaicQuickStartPanel
          scenarios={scenarios}
          onSelectScenario={() => {}}
          onSelectPreset={() => {}}
        />,
      ),
    ).not.toThrow();
  });
});

describe("MosaicAgentTeamPreview", () => {
  it("renders agent names", () => {
    const agents = [{ id: "a1", name: "Alpha", type: "GPT-4" }];
    render(<MosaicAgentTeamPreview agents={agents} />);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });
});
