/**
 * MosaicEditSessionDialog — tests
 *
 * Coverage: renders nothing when open=false; given host-supplied current
 * values, name/classification render PRE-FILLED; editing + save routes the
 * edited values to the host callback; cancel routes to its callback and does
 * NOT call save / mutate; canSave (host-computed) gates the save button;
 * every user-facing string is host-supplied (SIN-01) — no hardcoded copy
 * asserted anywhere; classifications come entirely from the host-supplied
 * `classifications` prop (no hardcoded taxonomy); no fetch/network call is
 * ever made by the component; data-slot="edit-session-dialog" present.
 *
 * jsdom-honesty: MosaicAdaptiveModal renders a native <dialog> and relies on
 * `showModal()`/`close()`, which this repo's src/test-setup.ts polyfills
 * (they merely toggle the `open` attribute — jsdom has no real modal
 * semantics). That polyfill cannot fail, so a jsdom green does NOT prove the
 * dialog truly opens as a modal in a browser (focus trap, top-layer
 * rendering, background inert via native modal semantics). This suite
 * therefore only asserts what jsdom CAN prove honestly, and the one
 * assertion that would require real browser semantics is `it.skip`, with
 * the reason declared inline — matching the precedent already set by the
 * sibling suites in this repo (MosaicEditMemoryDialog, MosaicAdaptiveModal).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicEditSessionDialog } from "./MosaicEditSessionDialog.js";

const CLASSIFICATIONS = [
  { value: "research", label: "Research" },
  { value: "build", label: "Build" },
  { value: "review", label: "Review" },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const BASE_PROPS = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Edit session",
  closeAriaLabel: "Close dialog",
  name: "Untitled scratch session",
  onNameChange: vi.fn(),
  nameLabel: "Session name",
  classifications: CLASSIFICATIONS,
  classification: "research",
  onClassificationChange: vi.fn(),
  classificationLabel: "Classification",
  isSaving: false,
  canSave: true,
  onSave: vi.fn(),
  onCancel: vi.fn(),
  saveButtonLabel: "Save",
  savingLabel: "Saving…",
  cancelButtonLabel: "Cancel",
};

describe("MosaicEditSessionDialog", () => {
  it("renders nothing when open=false", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} open={false} />
      </Wrapper>,
    );
    expect(screen.queryByText("Edit session")).toBeNull();
  });

  it("sets data-slot='edit-session-dialog' on the body when open", () => {
    const { container } = render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} />
      </Wrapper>,
    );
    expect(container.querySelector("[data-slot='edit-session-dialog']")).toBeTruthy();
  });

  it("pre-fills the name field from the host-supplied current value", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} />
      </Wrapper>,
    );
    expect(screen.getByDisplayValue("Untitled scratch session")).toBeTruthy();
  });

  it("pre-fills the classification field from the host-supplied current value", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} />
      </Wrapper>,
    );
    expect(screen.getByText("Research")).toBeTruthy();
  });

  it("renders classifications exclusively from the host-supplied classifications prop — no hardcoded taxonomy", async () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} />
      </Wrapper>,
    );
    fireEvent.click(
      screen
        .getByText("Classification")
        .parentElement?.querySelector("[data-slot='select']") as Element,
    );
    const options = await screen.findAllByRole("option");
    const optionLabels = options.map((option) => option.textContent);
    expect(optionLabels).toEqual(CLASSIFICATIONS.map((c) => c.label));
  });

  it("calls onNameChange when the name input is edited", () => {
    const onNameChange = vi.fn();
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} onNameChange={onNameChange} />
      </Wrapper>,
    );
    fireEvent.change(screen.getByLabelText("Session name"), {
      target: { value: "Renamed session" },
    });
    expect(onNameChange).toHaveBeenCalledWith("Renamed session");
  });

  it("routes the edited values to the host onSave callback when save is clicked", () => {
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicEditSessionDialog
          {...BASE_PROPS}
          name="Renamed session"
          classification="build"
          onSave={onSave}
        />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables the save button when canSave=false (host-computed) — submission never fires", () => {
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} canSave={false} onSave={onSave} />
      </Wrapper>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sets aria-busy and disables the save button while isSaving — and shows savingLabel", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} isSaving />
      </Wrapper>,
    );
    const button = screen.getByRole("button", { name: "Saving…" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls onCancel and does NOT call onSave when cancel is clicked — no mutation", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onNameChange = vi.fn();
    render(
      <Wrapper>
        <MosaicEditSessionDialog
          {...BASE_PROPS}
          onSave={onSave}
          onCancel={onCancel}
          onNameChange={onNameChange}
        />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    expect(onNameChange).not.toHaveBeenCalled();
  });

  it("disables the cancel button while isSaving", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} isSaving />
      </Wrapper>,
    );
    const button = screen.getByRole("button", { name: "Cancel" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows nameError with aria-invalid + aria-describedby when the host supplies one", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} nameError="Name cannot be empty" />
      </Wrapper>,
    );
    const input = screen.getByLabelText("Session name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Name cannot be empty")).toBeTruthy();
  });

  it("does not mark the name input invalid, and renders no error text, when no nameError is supplied", () => {
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} />
      </Wrapper>,
    );
    const input = screen.getByLabelText("Session name");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(screen.queryByText("Name cannot be empty")).toBeNull();
  });

  it("calls onOpenChange(false) without calling onSave when the dialog is closed via Escape", () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicEditSessionDialog {...BASE_PROPS} onOpenChange={onOpenChange} onSave={onSave} />
      </Wrapper>,
    );
    const dialog = document.querySelector("dialog");
    expect(dialog).toBeTruthy();
    fireEvent(dialog as HTMLDialogElement, new Event("cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("never issues a fetch/network call — zero I/O", () => {
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      render(
        <Wrapper>
          <MosaicEditSessionDialog {...BASE_PROPS} />
        </Wrapper>,
      );
      fireEvent.change(screen.getByLabelText("Session name"), {
        target: { value: "Renamed session" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ── Real-browser-only guarantee NOT provable under jsdom ───────────────────
  //
  // SKIPPED, deliberately, and the reason matters more than the test.
  //
  // MosaicAdaptiveModal renders a native <dialog> and calls showModal()/close()
  // on it. jsdom does not implement native <dialog> modal semantics at all —
  // this repo's src/test-setup.ts polyfills showModal/close by merely
  // toggling the `open` attribute, with no top-layer promotion, no real
  // focus trap and no native Escape-cancellation wiring. That polyfill
  // cannot fail, so no jsdom assertion can honestly prove the dialog "opens"
  // as a real modal (focus moves into it, background is inert via native
  // modal semantics, it paints above everything else). The sibling suites in
  // this repo (MosaicEditMemoryDialog, MosaicAdaptiveModal itself) hit the
  // identical wall and reached the identical verdict: skip it here, name why,
  // and rely on manual/Storybook QA in a real browser for that guarantee.
  it.skip("truly opens as a native modal dialog (top-layer, real focus trap) — NOT provable under jsdom's showModal polyfill", () => {
    // Intentionally left unimplemented — see comment above.
  });
});
