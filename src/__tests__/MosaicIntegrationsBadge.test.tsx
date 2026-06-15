/**
 * MosaicIntegrationsBadge — RED-first tests
 * Contract: renders without crash; shows label; wraps in link when href provided
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicIntegrationsBadge } from "../components/integrations-badge/MosaicIntegrationsBadge.js";

describe("MosaicIntegrationsBadge", () => {
  it("renders without crashing", () => {
    const { unmount } = render(<MosaicIntegrationsBadge label="Stripe" />);
    unmount();
  });

  it("renders the label", () => {
    render(<MosaicIntegrationsBadge label="GitHub" />);
    expect(screen.getByText("GitHub")).toBeTruthy();
  });

  it("renders as anchor when href is provided", () => {
    render(<MosaicIntegrationsBadge label="Notion" href="https://notion.so" />);
    const link = screen.getByRole("link");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("https://notion.so");
  });

  it("accepts logo slot", () => {
    const { container } = render(
      <MosaicIntegrationsBadge label="Slack" logo={<svg aria-label="Slack logo" />} />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
