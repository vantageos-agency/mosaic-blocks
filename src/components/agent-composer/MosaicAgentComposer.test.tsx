import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAgentComposer } from "./MosaicAgentComposer.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const baseProps = {
  agentName: "My Agent",
  onAgentNameChange: vi.fn(),
  customInstructions: "",
  onCustomInstructionsChange: vi.fn(),
  onSave: vi.fn(),
  canSave: true,
};

describe("MosaicAgentComposer", () => {
  it("renders without crashing in device provider", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAgentComposer {...baseProps} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("displays agent name field", () => {
    render(
      <Wrapper>
        <MosaicAgentComposer {...baseProps} />
      </Wrapper>,
    );
    // The agent name input should be present
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders save button when canSave=true", () => {
    render(
      <Wrapper>
        <MosaicAgentComposer {...baseProps} canSave={true} />
      </Wrapper>,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders with canSave=false without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicAgentComposer {...baseProps} canSave={false} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("has displayName set", () => {
    expect(MosaicAgentComposer.displayName).toBe("MosaicAgentComposer");
  });
});
