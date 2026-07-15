/**
 * MosaicThreadView — tests
 *
 * Coverage: several agent replies nest beneath the root message in document
 * order, the root and replies regions are distinguishable via their required
 * accessible names, an empty replies array renders the host-worded named
 * empty state (never a library-invented word), and the component performs
 * zero network I/O.
 */

import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MosaicThreadView } from "./MosaicThreadView.js";

const BASE_PROPS = {
  root: {
    id: "root-1",
    author: <span>Client</span>,
    content: <p>Quel est le statut du déploiement ?</p>,
  },
  replies: [
    { id: "reply-1", author: <span>Agent Recherche</span>, content: <p>Je vérifie les logs.</p> },
    {
      id: "reply-2",
      author: <span>Agent Déploiement</span>,
      content: <p>Déploiement en cours.</p>,
    },
  ],
  rootAriaLabel: "Message initial du fil",
  repliesAriaLabel: "Réponses des agents",
  emptyRepliesLabel: "Aucune réponse pour l'instant",
};

describe("MosaicThreadView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets data-slot='thread-view' on the root", () => {
    const { container } = render(<MosaicThreadView {...BASE_PROPS} />);
    expect(container.querySelector("[data-slot='thread-view']")).toBeTruthy();
  });

  it("renders the root message inside its own labelled region", () => {
    render(<MosaicThreadView {...BASE_PROPS} />);
    const rootRegion = screen.getByLabelText("Message initial du fil");
    expect(within(rootRegion).getByText("Client")).toBeTruthy();
    expect(within(rootRegion).getByText("Quel est le statut du déploiement ?")).toBeTruthy();
  });

  it("nests every reply beneath the root, inside a distinct labelled region, in order", () => {
    render(<MosaicThreadView {...BASE_PROPS} />);
    const repliesRegion = screen.getByLabelText("Réponses des agents");
    const rendered = within(repliesRegion)
      .getAllByText(/Agent (Recherche|Déploiement)/)
      .map((node) => node.textContent);
    expect(rendered).toEqual(["Agent Recherche", "Agent Déploiement"]);
    expect(within(repliesRegion).getByText("Je vérifie les logs.")).toBeTruthy();
    expect(within(repliesRegion).getByText("Déploiement en cours.")).toBeTruthy();
  });

  it("keeps the root and replies regions distinct (root text is not inside the replies region)", () => {
    render(<MosaicThreadView {...BASE_PROPS} />);
    const repliesRegion = screen.getByLabelText("Réponses des agents");
    expect(within(repliesRegion).queryByText("Client")).toBeNull();
  });

  it("renders the host-worded empty state when replies is an empty array (named absence-of-state)", () => {
    render(<MosaicThreadView {...BASE_PROPS} replies={[]} />);
    expect(screen.getByText("Aucune réponse pour l'instant")).toBeTruthy();
  });

  it("does not render the empty-state text when replies are present", () => {
    render(<MosaicThreadView {...BASE_PROPS} />);
    expect(screen.queryByText("Aucune réponse pour l'instant")).toBeNull();
  });

  it("performs zero network I/O — fetch is never called", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<MosaicThreadView {...BASE_PROPS} />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
