import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
    render(
      <MosaicMessageCard
        message={message}
        replyLabel="Reply"
        moreOptionsAriaLabel="More options"
        removeBookmarkAriaLabel="Remove bookmark"
        bookmarkAriaLabel="Bookmark message"
        removeBookmarkLabel="Remove bookmark"
        bookmarkLabel="Bookmark"
        copyMessageLabel="Copy message"
      />,
    );
    expect(screen.getByText("This is a great discussion point.")).toBeTruthy();
  });

  it("renders sender name", () => {
    render(
      <MosaicMessageCard
        message={message}
        replyLabel="Reply"
        moreOptionsAriaLabel="More options"
        removeBookmarkAriaLabel="Remove bookmark"
        bookmarkAriaLabel="Bookmark message"
        removeBookmarkLabel="Remove bookmark"
        bookmarkLabel="Bookmark"
        copyMessageLabel="Copy message"
      />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("renders without crashing in compact mode", () => {
    expect(() =>
      render(
        <MosaicMessageCard
          message={message}
          compact
          replyLabel="Reply"
          moreOptionsAriaLabel="More options"
          removeBookmarkAriaLabel="Remove bookmark"
          bookmarkAriaLabel="Bookmark message"
          removeBookmarkLabel="Remove bookmark"
          bookmarkLabel="Bookmark"
          copyMessageLabel="Copy message"
        />,
      ),
    ).not.toThrow();
  });

  it("renders like/dislike buttons for ai sender type", () => {
    const aiMessage = {
      ...message,
      sender: { id: "ai-1", name: "Bot", type: "ai" as const },
    };
    const { container } = render(
      <MosaicMessageCard
        message={aiMessage}
        replyLabel="Reply"
        moreOptionsAriaLabel="More options"
        removeBookmarkAriaLabel="Remove bookmark"
        bookmarkAriaLabel="Bookmark message"
        removeBookmarkLabel="Remove bookmark"
        bookmarkLabel="Bookmark"
        copyMessageLabel="Copy message"
      />,
    );
    // Like button renders for AI messages only
    const likeBtn = container.querySelector('[aria-label^="Like"]');
    expect(likeBtn).toBeTruthy();
  });

  it("renders the host-supplied aiSenderLabel badge for an ai sender", () => {
    const aiMessage = {
      ...message,
      sender: { id: "ai-1", name: "Bot", type: "ai" as const },
    };
    render(
      <MosaicMessageCard
        message={aiMessage}
        aiSenderLabel="Assistant IA"
        replyLabel="Reply"
        moreOptionsAriaLabel="More options"
        removeBookmarkAriaLabel="Remove bookmark"
        bookmarkAriaLabel="Bookmark message"
        removeBookmarkLabel="Remove bookmark"
        bookmarkLabel="Bookmark"
        copyMessageLabel="Copy message"
      />,
    );
    expect(screen.getByText("Assistant IA")).toBeTruthy();
  });

  it("renders no badge word of its own when aiSenderLabel is omitted for an ai sender", () => {
    const aiMessage = {
      ...message,
      sender: { id: "ai-1", name: "Bot", type: "ai" as const },
    };
    const { container } = render(
      <MosaicMessageCard
        message={aiMessage}
        replyLabel="Reply"
        moreOptionsAriaLabel="More options"
        removeBookmarkAriaLabel="Remove bookmark"
        bookmarkAriaLabel="Bookmark message"
        removeBookmarkLabel="Remove bookmark"
        bookmarkLabel="Bookmark"
        copyMessageLabel="Copy message"
      />,
    );
    // The library must not fabricate any label of its own (e.g. "AI").
    expect(container.textContent).not.toContain("AI");
  });

  it("accepts custom className", () => {
    const { container } = render(
      <MosaicMessageCard
        message={message}
        className="my-message"
        replyLabel="Reply"
        moreOptionsAriaLabel="More options"
        removeBookmarkAriaLabel="Remove bookmark"
        bookmarkAriaLabel="Bookmark message"
        removeBookmarkLabel="Remove bookmark"
        bookmarkLabel="Bookmark"
        copyMessageLabel="Copy message"
      />,
    );
    expect(container.querySelector(".my-message")).toBeTruthy();
  });
});
