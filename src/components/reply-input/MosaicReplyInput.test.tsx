/**
 * MosaicReplyInput — tests
 *
 * Coverage: the thread context it replies into is rendered from a
 * host-supplied node (never invented by the library), controlled textarea
 * (value/onValueChange), Enter submits / Shift+Enter inserts a newline, the
 * send button is disabled on an empty/whitespace-only value, cancel routes
 * to its own host callback, disabled disables every control, and the
 * component performs zero network I/O.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MosaicReplyInput } from "./MosaicReplyInput.js";

const BASE_PROPS = {
  value: "",
  onValueChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  context: <span>Fil de discussion : Agent Recherche</span>,
  contextAriaLabel: "Fil concerné par la réponse",
  textareaAriaLabel: "Répondre dans ce fil",
  placeholder: "Écrivez votre réponse...",
  sendButtonAriaLabel: "Envoyer la réponse",
  cancelButtonAriaLabel: "Annuler la réponse",
};

describe("MosaicReplyInput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets data-slot='reply-input' on the root", () => {
    const { container } = render(<MosaicReplyInput {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='reply-input']")).toBeTruthy();
  });

  it("renders the host-supplied thread context node inside a labelled region", () => {
    render(<MosaicReplyInput {...BASE_PROPS} />);
    expect(screen.getByText("Fil de discussion : Agent Recherche")).toBeTruthy();
    expect(screen.getByLabelText("Fil concerné par la réponse")).toBeTruthy();
  });

  it("renders the textarea with the required aria-label and placeholder, showing the controlled value", () => {
    render(<MosaicReplyInput {...BASE_PROPS} value="Bonjour" />);
    const textarea = screen.getByLabelText("Répondre dans ce fil");
    expect(textarea.getAttribute("placeholder")).toBe("Écrivez votre réponse...");
    expect((textarea as HTMLTextAreaElement).value).toBe("Bonjour");
  });

  it("calls onValueChange with the raw textarea value on every keystroke", () => {
    const onValueChange = vi.fn();
    render(<MosaicReplyInput {...BASE_PROPS} onValueChange={onValueChange} />);
    const textarea = screen.getByLabelText("Répondre dans ce fil");
    fireEvent.change(textarea, { target: { value: "Salut" } });
    expect(onValueChange).toHaveBeenCalledWith("Salut");
  });

  it("renders the send button with the required aria-label", () => {
    render(<MosaicReplyInput {...BASE_PROPS} value="Bonjour" />);
    expect(screen.getByRole("button", { name: "Envoyer la réponse" })).toBeTruthy();
  });

  it("disables the send button when the value is empty or whitespace-only", () => {
    render(<MosaicReplyInput {...BASE_PROPS} value="   " />);
    expect(
      screen.getByRole("button", { name: "Envoyer la réponse" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("calls onSubmit with the trimmed value when the send button is clicked", () => {
    const onSubmit = vi.fn();
    render(
      <MosaicReplyInput {...BASE_PROPS} value="  Merci pour le retour  " onSubmit={onSubmit} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Envoyer la réponse" }));
    expect(onSubmit).toHaveBeenCalledWith("Merci pour le retour");
  });

  it("submits on Enter without Shift", () => {
    const onSubmit = vi.fn();
    render(<MosaicReplyInput {...BASE_PROPS} value="Merci" onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText("Répondre dans ce fil");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledWith("Merci");
  });

  it("does not submit on Shift+Enter (newline)", () => {
    const onSubmit = vi.fn();
    render(<MosaicReplyInput {...BASE_PROPS} value="Merci" onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText("Répondre dans ce fil");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit on Enter when the value is empty", () => {
    const onSubmit = vi.fn();
    render(<MosaicReplyInput {...BASE_PROPS} value="" onSubmit={onSubmit} />);
    const textarea = screen.getByLabelText("Répondre dans ce fil");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders the cancel button with the required aria-label and calls onCancel when clicked", () => {
    const onCancel = vi.fn();
    render(<MosaicReplyInput {...BASE_PROPS} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Annuler la réponse" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the textarea, send button and cancel button when disabled is true", () => {
    render(<MosaicReplyInput {...BASE_PROPS} value="Bonjour" disabled={true} />);
    expect((screen.getByLabelText("Répondre dans ce fil") as HTMLTextAreaElement).disabled).toBe(
      true,
    );
    expect(
      screen.getByRole("button", { name: "Envoyer la réponse" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Annuler la réponse" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("performs zero network I/O — fetch is never called", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const onSubmit = vi.fn();
    render(<MosaicReplyInput {...BASE_PROPS} value="Bonjour" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Envoyer la réponse" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler la réponse" }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
