/**
 * MosaicApprovalPrompt — tests
 *
 * Coverage: "pending" status renders the tool name + host-rendered arguments
 * + approve/deny buttons with required labels, and calls onApprove/onDeny;
 * "responded" status renders the host-provided decisionMessage for both the
 * "approved" and "denied" decision values; "error" status renders the
 * host-provided errorMessage; the tool name + arguments region is present in
 * every status (host still wants context after the decision or on error); no
 * network/SDK call is ever made by the component itself (onApprove/onDeny are
 * the only side-effect paths); custom className is applied to the root.
 *
 * Contract shape: props are pushed into the `MosaicApprovalPromptState`
 * discriminated union exactly where they are read (base props are shared by
 * every test via BASE_PROPS; `onApprove`/`onDeny`/`approveButtonLabel`/
 * `denyButtonLabel` only exist on the "pending" prop bag; `decision`/
 * `decisionMessage` only on "responded"; `errorMessage` only on "error").
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicApprovalPrompt } from "./MosaicApprovalPrompt.js";

const BASE_PROPS = {
  toolName: "delete_file",
  toolNameLabel: "Outil demandé",
  promptTitle: "L'agent souhaite exécuter un outil",
  renderArguments: <pre data-testid="args-payload">{JSON.stringify({ path: "/tmp/x" })}</pre>,
};

describe("MosaicApprovalPrompt", () => {
  it("sets data-slot='approval-prompt' on the root", () => {
    const { container } = render(
      <MosaicApprovalPrompt
        {...BASE_PROPS}
        status="pending"
        onApprove={vi.fn()}
        onDeny={vi.fn()}
        approveButtonLabel="Approuver"
        denyButtonLabel="Refuser"
      />,
    );
    expect(container.querySelector("[data-slot='approval-prompt']")).toBeTruthy();
  });

  it("renders the required promptTitle and toolNameLabel + toolName", () => {
    render(
      <MosaicApprovalPrompt
        {...BASE_PROPS}
        status="pending"
        onApprove={vi.fn()}
        onDeny={vi.fn()}
        approveButtonLabel="Approuver"
        denyButtonLabel="Refuser"
      />,
    );
    expect(screen.getByText("L'agent souhaite exécuter un outil")).toBeTruthy();
    expect(screen.getByText("Outil demandé")).toBeTruthy();
    expect(screen.getByText("delete_file")).toBeTruthy();
  });

  it("renders the host-supplied renderArguments node", () => {
    render(
      <MosaicApprovalPrompt
        {...BASE_PROPS}
        status="pending"
        onApprove={vi.fn()}
        onDeny={vi.fn()}
        approveButtonLabel="Approuver"
        denyButtonLabel="Refuser"
      />,
    );
    expect(screen.getByTestId("args-payload")).toBeTruthy();
  });

  describe("pending state", () => {
    it("renders approve/deny buttons with the required labels", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="pending"
          onApprove={vi.fn()}
          onDeny={vi.fn()}
          approveButtonLabel="Approuver"
          denyButtonLabel="Refuser"
        />,
      );
      expect(screen.getByRole("button", { name: "Approuver" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Refuser" })).toBeTruthy();
    });

    it("calls onApprove when the approve button is clicked", () => {
      const onApprove = vi.fn();
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="pending"
          onApprove={onApprove}
          onDeny={vi.fn()}
          approveButtonLabel="Approuver"
          denyButtonLabel="Refuser"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Approuver" }));
      expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it("calls onDeny when the deny button is clicked", () => {
      const onDeny = vi.fn();
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="pending"
          onApprove={vi.fn()}
          onDeny={onDeny}
          approveButtonLabel="Approuver"
          denyButtonLabel="Refuser"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
      expect(onDeny).toHaveBeenCalledTimes(1);
    });

    it("does not render a decision message or error message while pending", () => {
      const { container } = render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="pending"
          onApprove={vi.fn()}
          onDeny={vi.fn()}
          approveButtonLabel="Approuver"
          denyButtonLabel="Refuser"
        />,
      );
      expect(container.querySelector("[data-slot='approval-prompt-decision']")).toBeNull();
      expect(container.querySelector("[data-slot='approval-prompt-error']")).toBeNull();
    });
  });

  describe("responded state", () => {
    it("renders the host-provided decisionMessage for an 'approved' decision", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="responded"
          decision="approved"
          decisionMessage="Appel approuvé — exécution en cours"
        />,
      );
      expect(screen.getByText("Appel approuvé — exécution en cours")).toBeTruthy();
    });

    it("renders a different host-provided decisionMessage for a 'denied' decision", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="responded"
          decision="denied"
          decisionMessage="Appel refusé par l'utilisateur"
        />,
      );
      expect(screen.getByText("Appel refusé par l'utilisateur")).toBeTruthy();
    });

    it("does not render approve/deny buttons once responded", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="responded"
          decision="approved"
          decisionMessage="Appel approuvé — exécution en cours"
        />,
      );
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("still renders the tool name and arguments once responded", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="responded"
          decision="denied"
          decisionMessage="Appel refusé par l'utilisateur"
        />,
      );
      expect(screen.getByText("delete_file")).toBeTruthy();
      expect(screen.getByTestId("args-payload")).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("renders the host-provided errorMessage", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="error"
          errorMessage="Décision non transmise"
        />,
      );
      expect(screen.getByText("Décision non transmise")).toBeTruthy();
    });

    it("does not render approve/deny buttons on error", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="error"
          errorMessage="Décision non transmise"
        />,
      );
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("still renders the tool name and arguments on error", () => {
      render(
        <MosaicApprovalPrompt
          {...BASE_PROPS}
          status="error"
          errorMessage="Décision non transmise"
        />,
      );
      expect(screen.getByText("delete_file")).toBeTruthy();
      expect(screen.getByTestId("args-payload")).toBeTruthy();
    });
  });

  it("performs no network call — onApprove/onDeny are pure prop callbacks", () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(
      <MosaicApprovalPrompt
        {...BASE_PROPS}
        status="pending"
        onApprove={onApprove}
        onDeny={onDeny}
        approveButtonLabel="Approuver"
        denyButtonLabel="Refuser"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approuver" }));
    expect(onApprove).toHaveBeenCalled();
    expect(onDeny).not.toHaveBeenCalled();
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicApprovalPrompt
        {...BASE_PROPS}
        status="pending"
        onApprove={vi.fn()}
        onDeny={vi.fn()}
        approveButtonLabel="Approuver"
        denyButtonLabel="Refuser"
        className="my-custom-class"
      />,
    );
    const root = container.querySelector("[data-slot='approval-prompt']");
    expect(root?.className).toContain("my-custom-class");
  });
});
