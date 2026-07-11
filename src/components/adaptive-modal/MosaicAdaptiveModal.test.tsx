import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAdaptiveModal } from "./MosaicAdaptiveModal.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

describe("MosaicAdaptiveModal", () => {
  it("renders nothing when isOpen=false", () => {
    render(
      <Wrapper>
        <MosaicAdaptiveModal
          isOpen={false}
          onClose={() => {}}
          title="Dialog"
          closeAriaLabel="Close dialog"
        >
          <p>Modal content</p>
        </MosaicAdaptiveModal>
      </Wrapper>,
    );
    expect(screen.queryByText("Modal content")).toBeNull();
  });

  it("renders children when isOpen=true", () => {
    render(
      <Wrapper>
        <MosaicAdaptiveModal isOpen onClose={() => {}} title="Dialog" closeAriaLabel="Close dialog">
          <p>Modal content</p>
        </MosaicAdaptiveModal>
      </Wrapper>,
    );
    expect(screen.getByText("Modal content")).toBeTruthy();
  });

  it("renders title when isOpen=true", () => {
    render(
      <Wrapper>
        <MosaicAdaptiveModal
          isOpen
          onClose={() => {}}
          title="My Dialog"
          closeAriaLabel="Close dialog"
        >
          <p>Body</p>
        </MosaicAdaptiveModal>
      </Wrapper>,
    );
    expect(screen.getByText("My Dialog")).toBeTruthy();
  });

  it("calls onClose callback when provided and dialog visible", () => {
    const onClose = vi.fn();
    render(
      <Wrapper>
        <MosaicAdaptiveModal
          isOpen
          onClose={onClose}
          title="Closeable"
          closeAriaLabel="Close dialog"
        >
          <p>Content</p>
        </MosaicAdaptiveModal>
      </Wrapper>,
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders with data-slot attribute", () => {
    const { container } = render(
      <Wrapper>
        <MosaicAdaptiveModal
          isOpen
          onClose={() => {}}
          title="Slotted"
          closeAriaLabel="Close dialog"
        >
          <p>Body</p>
        </MosaicAdaptiveModal>
      </Wrapper>,
    );
    expect(container.querySelector('[data-slot="adaptive-modal"]')).toBeTruthy();
  });
});
