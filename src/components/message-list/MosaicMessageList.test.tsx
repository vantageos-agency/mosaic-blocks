import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicMessageList } from "./MosaicMessageList.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const messages = [
  {
    id: "m1",
    content: "Hello world",
    sender: { id: "u1", name: "Alice", type: "user" as const },
    timestamp: new Date().toISOString(),
  },
  {
    id: "m2",
    content: "AI response here",
    sender: { id: "ai1", name: "Bot", type: "ai" as const },
    timestamp: new Date().toISOString(),
  },
];

describe("MosaicMessageList", () => {
  it("renders message contents", () => {
    render(
      <Wrapper>
        <MosaicMessageList messages={messages} />
      </Wrapper>,
    );
    expect(screen.getByText("Hello world")).toBeTruthy();
    expect(screen.getByText("AI response here")).toBeTruthy();
  });

  it("renders title when provided", () => {
    render(
      <Wrapper>
        <MosaicMessageList messages={messages} title="Conversation" />
      </Wrapper>,
    );
    expect(screen.getByText("Conversation")).toBeTruthy();
  });

  it("renders empty list without error", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicMessageList messages={[]} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Wrapper>
        <MosaicMessageList messages={messages} className="msg-list" />
      </Wrapper>,
    );
    expect(container.querySelector(".msg-list")).toBeTruthy();
  });

  it("renders without error when hasMore=true", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicMessageList messages={messages} hasMore={true} onLoadMore={() => {}} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });
});
