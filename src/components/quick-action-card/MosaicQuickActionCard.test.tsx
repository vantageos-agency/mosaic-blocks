import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicQuickActionCard } from "./MosaicQuickActionCard.js";

const actions = [
  {
    id: "create",
    title: "Create",
    description: "Create something new",
    href: "/create",
    accent: "blue" as const,
    icon: <span>+</span>,
  },
  {
    id: "explore",
    title: "Explore",
    description: "Explore templates",
    href: "/explore",
    accent: "green" as const,
    icon: <span>*</span>,
  },
];

describe("MosaicQuickActionCard", () => {
  it("renders action titles", () => {
    render(<MosaicQuickActionCard actions={actions} />);
    expect(screen.getByText("Create")).toBeTruthy();
    expect(screen.getByText("Explore")).toBeTruthy();
  });

  it("renders action descriptions", () => {
    render(<MosaicQuickActionCard actions={actions} />);
    expect(screen.getByText("Create something new")).toBeTruthy();
  });

  it("renders with empty actions without error", () => {
    expect(() => render(<MosaicQuickActionCard actions={[]} />)).not.toThrow();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <MosaicQuickActionCard actions={actions} className="my-class" />,
    );
    expect(container.querySelector(".my-class")).toBeTruthy();
  });

  it("uses renderLink when provided", () => {
    const renderLink = vi.fn((href: string, children: React.ReactNode) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    ));
    render(<MosaicQuickActionCard actions={actions} renderLink={renderLink} />);
    expect(renderLink).toHaveBeenCalled();
  });
});
