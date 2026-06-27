import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicQuickActionsMenu } from "./MosaicQuickActionsMenu.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const actions = [
  { id: "new-debate", label: "New Debate", onClick: vi.fn() },
  { id: "new-agent", label: "New Agent", onClick: vi.fn() },
  { id: "import", label: "Import", onClick: vi.fn(), separator: true },
];

describe("MosaicQuickActionsMenu", () => {
  it("renders trigger button", () => {
    render(
      <Wrapper>
        <MosaicQuickActionsMenu actions={actions} />
      </Wrapper>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeTruthy();
  });

  it("opens menu and shows action items on click", async () => {
    render(
      <Wrapper>
        <MosaicQuickActionsMenu actions={actions} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("New Debate")).toBeTruthy();
    expect(screen.getByText("New Agent")).toBeTruthy();
  });

  it("calls action onClick when menu item clicked", async () => {
    const onNew = vi.fn();
    const acts = [{ id: "new", label: "New", onClick: onNew }];
    render(
      <Wrapper>
        <MosaicQuickActionsMenu actions={acts} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByText("New"));
    expect(onNew).toHaveBeenCalled();
  });

  it("renders custom label on trigger", () => {
    render(
      <Wrapper>
        <MosaicQuickActionsMenu actions={actions} label="Quick Actions" />
      </Wrapper>,
    );
    expect(screen.getByText("Quick Actions")).toBeTruthy();
  });

  it("renders without actions without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicQuickActionsMenu actions={[]} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });
});
