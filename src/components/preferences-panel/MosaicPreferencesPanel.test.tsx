import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicPreferencesPanel } from "./MosaicPreferencesPanel.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const groups = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Visual settings",
    preferences: [
      {
        id: "theme",
        label: "Theme",
        type: "select" as const,
        value: "system",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ],
      },
      {
        id: "notifications",
        label: "Notifications",
        type: "toggle" as const,
        value: true,
      },
    ],
  },
];

describe("MosaicPreferencesPanel", () => {
  it("renders group titles", () => {
    render(
      <Wrapper>
        <MosaicPreferencesPanel
          groups={groups}
          onChange={() => {}}
          onSave={() => {}}
          saveLabel="Save Preferences"
          savingLabel="Saving…"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Appearance")).toBeTruthy();
  });

  it("renders preference labels", () => {
    render(
      <Wrapper>
        <MosaicPreferencesPanel
          groups={groups}
          onChange={() => {}}
          onSave={() => {}}
          saveLabel="Save Preferences"
          savingLabel="Saving…"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Theme")).toBeTruthy();
    expect(screen.getByText("Notifications")).toBeTruthy();
  });

  it("renders save button", () => {
    render(
      <Wrapper>
        <MosaicPreferencesPanel
          groups={groups}
          onChange={() => {}}
          onSave={() => {}}
          saveLabel="Save Settings"
          savingLabel="Saving…"
        />
      </Wrapper>,
    );
    expect(screen.getByRole("button", { name: /Save Settings/i })).toBeTruthy();
  });

  it("calls onSave when save button clicked", async () => {
    const onSave = vi.fn();
    const { getByRole } = render(
      <Wrapper>
        <MosaicPreferencesPanel
          groups={groups}
          onChange={() => {}}
          onSave={onSave}
          saveLabel="Save Preferences"
          savingLabel="Saving…"
        />
      </Wrapper>,
    );
    const saveBtn = getByRole("button", { name: /save/i });
    saveBtn.click();
    expect(onSave).toHaveBeenCalled();
  });

  it("renders with empty groups array", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicPreferencesPanel
            groups={[]}
            onChange={() => {}}
            onSave={() => {}}
            saveLabel="Save Preferences"
            savingLabel="Saving…"
          />
        </Wrapper>,
      ),
    ).not.toThrow();
  });
});
