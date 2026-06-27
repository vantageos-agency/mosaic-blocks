import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicMessageCard } from "./MosaicMessageCard.js";

const message = {
  id: "msg-1",
  content: "This is a great discussion point.",
  sender: {
    id: "user-1",
    name: "Alice",
    type: "user" as const,
  },
  timestamp: new Date().toISOString(),
  reactions: { likes: 3, dislikes: 0 },
  replyCount: 2,
};

describe("MosaicMessageCard", () => {
  it("renders message content", () => {
    render(<MosaicMessageCard message={message} />);
    expect(screen.getByText("This is a great discussion point.")).toBeTruthy();
  });

  it("renders sender name", () => {
    render(<MosaicMessageCard message={message} />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("renders without crashing in compact mode", () => {
    expect(() => render(<MosaicMessageCard message={message} compact />)).not.toThrow();
  });

  it("renders like/dislike buttons for ai sender type", () => {
    const aiMessage = {
      ...message,
      sender: { id: "ai-1", name: "Bot", type: "ai" as const },
    };
    const { container } = render(<MosaicMessageCard message={aiMessage} />);
    // Like button renders for AI messages only
    const likeBtn = container.querySelector('[aria-label^="Like"]');
    expect(likeBtn).toBeTruthy();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <MosaicMessageCard message={message} className="my-message" />,
    );
    expect(container.querySelector(".my-message")).toBeTruthy();
  });
});
