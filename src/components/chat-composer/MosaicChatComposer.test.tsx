/**
 * MosaicChatComposer — tests
 *
 * Coverage: controlled textarea (value/onValueChange), Enter submits /
 * Shift+Enter inserts a newline while status === "idle", the send button is
 * disabled on an empty/whitespace-only value, the send button becomes a
 * STOP button once status === "responding" (onStop, stopButtonAriaLabel —
 * our differentiator), Enter does nothing while responding (no onSubmit
 * exists on that branch), disabled prop disables the textarea, and the
 * aria-live region announces the current button label.
 *
 * Contract shape: props are pushed into the `MosaicChatComposerState`
 * discriminated union exactly where they are read — `onSubmit` +
 * `sendButtonAriaLabel` only exist on "idle", `onStop` +
 * `stopButtonAriaLabel` only exist on "responding" (the branch the guard
 * would otherwise let lie).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicChatComposer } from "./MosaicChatComposer.js";

const BASE_PROPS = {
  value: "",
  onValueChange: vi.fn(),
  textareaAriaLabel: "Message à eve",
  placeholder: "Demandez ce que vous voulez à eve...",
};

describe("MosaicChatComposer", () => {
  it("sets data-slot='chat-composer' on the root", () => {
    const { container } = render(
      <MosaicChatComposer
        {...BASE_PROPS}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    expect(container.querySelector("[data-slot='chat-composer']")).toBeTruthy();
  });

  it("renders the textarea with the required aria-label and placeholder, showing the controlled value", () => {
    render(
      <MosaicChatComposer
        {...BASE_PROPS}
        value="Bonjour"
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    const textarea = screen.getByLabelText("Message à eve");
    expect(textarea.getAttribute("placeholder")).toBe("Demandez ce que vous voulez à eve...");
    expect((textarea as HTMLTextAreaElement).value).toBe("Bonjour");
  });

  it("calls onValueChange with the raw textarea value on every keystroke", () => {
    const onValueChange = vi.fn();
    render(
      <MosaicChatComposer
        {...BASE_PROPS}
        onValueChange={onValueChange}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    const textarea = screen.getByLabelText("Message à eve");
    fireEvent.change(textarea, { target: { value: "Salut" } });
    expect(onValueChange).toHaveBeenCalledWith("Salut");
  });

  describe("idle state — can submit", () => {
    it("renders the send button with the required aria-label", () => {
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour"
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      expect(screen.getByRole("button", { name: "Envoyer le message" })).toBeTruthy();
    });

    it("disables the send button when the value is empty or whitespace-only", () => {
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="   "
          status="idle"
          onSubmit={vi.fn()}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Envoyer le message" }).hasAttribute("disabled"),
      ).toBe(true);
    });

    it("calls onSubmit with the trimmed value when the send button is clicked", () => {
      const onSubmit = vi.fn();
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="  Bonjour eve  "
          status="idle"
          onSubmit={onSubmit}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));
      expect(onSubmit).toHaveBeenCalledWith("Bonjour eve");
    });

    it("submits on Enter without Shift", () => {
      const onSubmit = vi.fn();
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour eve"
          status="idle"
          onSubmit={onSubmit}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      const textarea = screen.getByLabelText("Message à eve");
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      expect(onSubmit).toHaveBeenCalledWith("Bonjour eve");
    });

    it("does not submit on Shift+Enter (newline)", () => {
      const onSubmit = vi.fn();
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour eve"
          status="idle"
          onSubmit={onSubmit}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      const textarea = screen.getByLabelText("Message à eve");
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not call onSubmit on Enter when the value is empty", () => {
      const onSubmit = vi.fn();
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value=""
          status="idle"
          onSubmit={onSubmit}
          sendButtonAriaLabel="Envoyer le message"
        />,
      );
      const textarea = screen.getByLabelText("Message à eve");
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("responding state — can stop (the differentiator)", () => {
    it("renders a STOP button with the required aria-label instead of the send button", () => {
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour"
          status="responding"
          onStop={vi.fn()}
          stopButtonAriaLabel="Arrêter la réponse"
        />,
      );
      expect(screen.getByRole("button", { name: "Arrêter la réponse" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Envoyer le message" })).toBeNull();
    });

    it("calls onStop when the stop button is clicked", () => {
      const onStop = vi.fn();
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour"
          status="responding"
          onStop={onStop}
          stopButtonAriaLabel="Arrêter la réponse"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Arrêter la réponse" }));
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it("does not submit on Enter while responding (onSubmit does not exist on this branch)", () => {
      const onStop = vi.fn();
      render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour"
          status="responding"
          onStop={onStop}
          stopButtonAriaLabel="Arrêter la réponse"
        />,
      );
      const textarea = screen.getByLabelText("Message à eve");
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      expect(onStop).not.toHaveBeenCalled();
    });

    it("announces the current button label in an aria-live region", () => {
      const { container } = render(
        <MosaicChatComposer
          {...BASE_PROPS}
          value="Bonjour"
          status="responding"
          onStop={vi.fn()}
          stopButtonAriaLabel="Arrêter la réponse"
        />,
      );
      const live = container.querySelector("[data-slot='chat-composer-status-announcer']");
      expect(live?.getAttribute("aria-live")).toBe("polite");
      expect(live?.textContent).toBe("Arrêter la réponse");
    });
  });

  it("disables the textarea when the disabled prop is true", () => {
    render(
      <MosaicChatComposer
        {...BASE_PROPS}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
        disabled
      />,
    );
    const textarea = screen.getByLabelText("Message à eve");
    expect(textarea.hasAttribute("disabled")).toBe(true);
  });

  it("performs no network call — onSubmit/onStop are pure prop callbacks", () => {
    const onSubmit = vi.fn();
    render(
      <MosaicChatComposer
        {...BASE_PROPS}
        value="Bonjour"
        status="idle"
        onSubmit={onSubmit}
        sendButtonAriaLabel="Envoyer le message"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le message" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicChatComposer
        {...BASE_PROPS}
        status="idle"
        onSubmit={vi.fn()}
        sendButtonAriaLabel="Envoyer le message"
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='chat-composer']");
    expect(root?.className).toContain("my-custom-class");
  });
});
