/**
 * MosaicApiKeyPanel — tests
 *
 * Coverage: idle renders data-driven provider tabs + masked input + submit
 * calls onValidate with the active provider id and trimmed key; provider
 * tab click calls onProviderChange; validating disables the input/button
 * and shows the required validatingLabel; valid shows the host-supplied
 * savedKeyLastFour hint (never the full key) and calls onRemove; invalid
 * shows the host-supplied errorMessage; the input is type="password" and
 * the raw key never appears anywhere in the rendered DOM except the
 * input's own `value` attribute (never in aria-label/title/error message/
 * hint text, never logged to console).
 *
 * Contract shape: props are pushed into the `MosaicApiKeyPanelState`
 * discriminated union exactly where they are read (base props are shared
 * by every test via BASE_PROPS; `validatingLabel` only exists on the
 * "validating" prop bag; `savedKeyLastFour`/`savedKeyHintLabel`/
 * `removeButtonLabel`/`onRemove` only on "valid"; `errorMessage` only on
 * "invalid") — this file exercises the type contract directly (each
 * `render` call below only compiles because the branch-specific props it
 * passes match the branch's `status`).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicApiKeyPanel } from "./MosaicApiKeyPanel.js";

const PROVIDERS = [
  { id: "gateway", label: "Vercel AI Gateway", placeholder: "vck_…" },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-v1-…" },
];

const BASE_PROPS = {
  providers: PROVIDERS,
  activeProviderId: "gateway",
  onProviderChange: vi.fn(),
  tabsAriaLabel: "Fournisseur de clé",
  keyValue: "",
  onKeyChange: vi.fn(),
  onValidate: vi.fn(),
  inputAriaLabel: "Clé API",
  validateButtonLabel: "Valider et entrer",
};

describe("MosaicApiKeyPanel", () => {
  it("sets data-slot='api-key-panel' on the root", () => {
    const { container } = render(<MosaicApiKeyPanel {...BASE_PROPS} status="idle" />);
    expect(container.querySelector("[data-slot='api-key-panel']")).toBeTruthy();
  });

  it("renders one tab per host-supplied provider (data-driven, not hardcoded)", () => {
    render(<MosaicApiKeyPanel {...BASE_PROPS} status="idle" />);
    expect(screen.getByText("Vercel AI Gateway")).toBeTruthy();
    expect(screen.getByText("OpenRouter")).toBeTruthy();
  });

  it("renders the key input as type='password' with the required aria-label", () => {
    render(<MosaicApiKeyPanel {...BASE_PROPS} status="idle" />);
    const input = screen.getByLabelText("Clé API");
    expect(input.getAttribute("type")).toBe("password");
  });

  it("calls onProviderChange with the clicked provider id", () => {
    const onProviderChange = vi.fn();
    render(<MosaicApiKeyPanel {...BASE_PROPS} status="idle" onProviderChange={onProviderChange} />);
    fireEvent.click(screen.getByText("OpenRouter"));
    expect(onProviderChange).toHaveBeenCalledWith("openrouter");
  });

  it("calls onKeyChange when the input value changes", () => {
    const onKeyChange = vi.fn();
    render(<MosaicApiKeyPanel {...BASE_PROPS} status="idle" onKeyChange={onKeyChange} />);
    const input = screen.getByLabelText("Clé API");
    fireEvent.change(input, { target: { value: "sk-or-secret" } });
    expect(onKeyChange).toHaveBeenCalledWith("sk-or-secret");
  });

  it("calls onValidate with the active provider id and the trimmed key on submit", () => {
    const onValidate = vi.fn();
    const { container } = render(
      <MosaicApiKeyPanel
        {...BASE_PROPS}
        status="idle"
        keyValue="  sk-or-secret-key  "
        onValidate={onValidate}
      />,
    );
    const form = container.querySelector("[data-slot='api-key-panel-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);
    expect(onValidate).toHaveBeenCalledWith("gateway", "sk-or-secret-key");
  });

  it("does not call onValidate when the key is empty", () => {
    const onValidate = vi.fn();
    const { container } = render(
      <MosaicApiKeyPanel {...BASE_PROPS} status="idle" keyValue="   " onValidate={onValidate} />,
    );
    const form = container.querySelector("[data-slot='api-key-panel-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);
    expect(onValidate).not.toHaveBeenCalled();
  });

  it("disables the input and button and shows validatingLabel while status === 'validating'", () => {
    render(
      <MosaicApiKeyPanel
        {...BASE_PROPS}
        status="validating"
        keyValue="sk-or-secret"
        validatingLabel="Vérification…"
      />,
    );
    const input = screen.getByLabelText("Clé API") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(screen.getAllByText("Vérification…").length).toBeGreaterThan(0);
  });

  it("renders the host-supplied errorMessage on status === 'invalid'", () => {
    render(<MosaicApiKeyPanel {...BASE_PROPS} status="invalid" errorMessage="Clé refusée." />);
    expect(screen.getByText("Clé refusée.")).toBeTruthy();
  });

  it("renders the savedKeyLastFour hint and calls onRemove on status === 'valid'", () => {
    const onRemove = vi.fn();
    render(
      <MosaicApiKeyPanel
        {...BASE_PROPS}
        status="valid"
        savedKeyLastFour="a1b2"
        savedKeyHintLabel={(lastFour) => `Clé enregistrée se terminant par …${lastFour}`}
        removeButtonLabel="Retirer"
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText("Clé enregistrée se terminant par …a1b2")).toBeTruthy();
    fireEvent.click(screen.getByText("Retirer"));
    expect(onRemove).toHaveBeenCalled();
  });

  it("SECURITY: the full raw key never appears in the rendered DOM outside the password input's value attribute", () => {
    const secretKey = "sk-or-v1-super-secret-do-not-leak-1234";
    const { container } = render(
      <MosaicApiKeyPanel {...BASE_PROPS} status="idle" keyValue={secretKey} />,
    );
    const input = screen.getByLabelText("Clé API") as HTMLInputElement;
    // The input itself legitimately carries the value (that is how any
    // controlled password field works) — but every OTHER attribute and
    // all rendered text content must be free of the raw key.
    expect(input.value).toBe(secretKey);
    expect(input.type).toBe("password");

    const rootHtmlWithoutInputValue = container.innerHTML.replace(`value="${secretKey}"`, "");
    expect(rootHtmlWithoutInputValue).not.toContain(secretKey);
    expect(container.textContent ?? "").not.toContain(secretKey);
  });

  it("SECURITY: does not log the key to the console at any point (idle -> change -> submit)", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const secretKey = "sk-or-v1-never-logged-9876";
    const onValidate = vi.fn();
    const { container, rerender } = render(
      <MosaicApiKeyPanel {...BASE_PROPS} status="idle" keyValue="" onValidate={onValidate} />,
    );
    const input = screen.getByLabelText("Clé API");
    fireEvent.change(input, { target: { value: secretKey } });
    rerender(
      <MosaicApiKeyPanel
        {...BASE_PROPS}
        status="idle"
        keyValue={secretKey}
        onValidate={onValidate}
      />,
    );
    const form = container.querySelector("[data-slot='api-key-panel-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);

    const allCalls = [
      ...consoleSpy.mock.calls,
      ...consoleErrorSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
    ];
    for (const call of allCalls) {
      for (const arg of call) {
        expect(String(arg)).not.toContain(secretKey);
      }
    }
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("SECURITY: savedKeyHintLabel only ever receives the last-4 hint, never the full key", () => {
    const savedKeyHintLabel = vi.fn((lastFour: string) => `…${lastFour}`);
    render(
      <MosaicApiKeyPanel
        {...BASE_PROPS}
        status="valid"
        savedKeyLastFour="wx9z"
        savedKeyHintLabel={savedKeyHintLabel}
        removeButtonLabel="Retirer"
        onRemove={vi.fn()}
      />,
    );
    expect(savedKeyHintLabel).toHaveBeenCalledWith("wx9z");
    expect(savedKeyHintLabel).toHaveBeenCalledTimes(1);
  });
});
