/**
 * MosaicMarkdown — tests
 *
 * Coverage: dependency-free minimal markdown rendering (headings, paragraphs,
 * ordered/unordered lists, links, bold/italic, inline code, fenced code
 * blocks, tables, blockquotes, horizontal rules); the `renderCodeBlock`
 * extension point; ref/className forwarding; and — non-negotiable — the
 * security contract: the `content` prop comes from an untrusted LLM, so raw
 * HTML/script tags must never be parsed as active markup and unsafe link
 * schemes (`javascript:`, `data:text/html`) must never be rendered as a
 * clickable `href`.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicMarkdown } from "./MosaicMarkdown.js";

describe("MosaicMarkdown", () => {
  it("sets data-slot='markdown' on the root", () => {
    const { container } = render(<MosaicMarkdown content="hello" />);
    expect(container.querySelector("[data-slot='markdown']")).toBeTruthy();
  });

  it("applies custom className to the root", () => {
    const { container } = render(<MosaicMarkdown content="hello" className="my-custom-class" />);
    const root = container.querySelector("[data-slot='markdown']");
    expect(root?.className).toContain("my-custom-class");
  });

  it("renders the raw content prop somewhere for plain text", () => {
    render(<MosaicMarkdown content="Just a plain sentence." />);
    expect(screen.getByText("Just a plain sentence.")).toBeTruthy();
  });

  describe("headings", () => {
    it.each([
      ["#", 1],
      ["##", 2],
      ["###", 3],
      ["####", 4],
      ["#####", 5],
      ["######", 6],
    ] as const)("renders %s as an h%s", (marker, level) => {
      const { container } = render(<MosaicMarkdown content={`${marker} Title text`} />);
      const heading = container.querySelector(`h${level}`);
      expect(heading?.textContent).toBe("Title text");
    });
  });

  it("renders a paragraph", () => {
    const { container } = render(<MosaicMarkdown content="A simple paragraph." />);
    const p = container.querySelector("p");
    expect(p?.textContent).toBe("A simple paragraph.");
  });

  it("renders an unordered list", () => {
    const { container } = render(<MosaicMarkdown content={"- one\n- two\n- three"} />);
    const ul = container.querySelector("ul");
    expect(ul).toBeTruthy();
    const items = ul ? [...ul.querySelectorAll("li")].map((li) => li.textContent) : [];
    expect(items).toEqual(["one", "two", "three"]);
  });

  it("renders an ordered list", () => {
    const { container } = render(<MosaicMarkdown content={"1. first\n2. second"} />);
    const ol = container.querySelector("ol");
    expect(ol).toBeTruthy();
    const items = ol ? [...ol.querySelectorAll("li")].map((li) => li.textContent) : [];
    expect(items).toEqual(["first", "second"]);
  });

  it("renders bold and italic emphasis", () => {
    const { container } = render(<MosaicMarkdown content="**bold** and *italic*" />);
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");
  });

  it("renders inline code", () => {
    const { container } = render(<MosaicMarkdown content="use `npm install` now" />);
    expect(container.querySelector("code")?.textContent).toBe("npm install");
  });

  it("renders a fenced code block with the language available on the element", () => {
    const { container } = render(<MosaicMarkdown content={"```ts\nconst x = 1;\n```"} />);
    const pre = container.querySelector("[data-slot='markdown-code-block']");
    expect(pre?.getAttribute("data-language")).toBe("ts");
    expect(pre?.textContent).toContain("const x = 1;");
  });

  it("renders a fenced code block without a language", () => {
    const { container } = render(<MosaicMarkdown content={"```\nplain\n```"} />);
    const pre = container.querySelector("[data-slot='markdown-code-block']");
    expect(pre?.hasAttribute("data-language")).toBe(false);
    expect(pre?.textContent).toContain("plain");
  });

  it("uses the host-supplied renderCodeBlock extension point instead of the default <pre>", () => {
    const { container } = render(
      <MosaicMarkdown
        content={"```ts\nconst x = 1;\n```"}
        renderCodeBlock={({ language, code }) => (
          <div data-slot="custom-highlighter" data-lang={language}>
            {code}
          </div>
        )}
      />,
    );
    expect(container.querySelector("[data-slot='markdown-code-block']")).toBeNull();
    const custom = container.querySelector("[data-slot='custom-highlighter']");
    expect(custom?.getAttribute("data-lang")).toBe("ts");
    expect(custom?.textContent).toBe("const x = 1;");
  });

  it("renders a link with a safe http(s) href and noopener/noreferrer + _blank", () => {
    const { container } = render(<MosaicMarkdown content="[VantageOS](https://vantageos.com)" />);
    const link = screen.getByRole("link", { name: "VantageOS" });
    expect(link.getAttribute("href")).toBe("https://vantageos.com");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(container.querySelector("a")).toBe(link);
  });

  it("renders a blockquote", () => {
    const { container } = render(<MosaicMarkdown content="> quoted wisdom" />);
    expect(container.querySelector("blockquote")?.textContent).toBe("quoted wisdom");
  });

  it("renders a horizontal rule", () => {
    const { container } = render(<MosaicMarkdown content={"above\n\n---\n\nbelow"} />);
    expect(container.querySelector("hr")).toBeTruthy();
  });

  it("renders a table with header and body rows", () => {
    const { container } = render(
      <MosaicMarkdown
        content={"| Name | Role |\n| --- | --- |\n| Ada | Engineer |\n| Grace | Admiral |"}
      />,
    );
    const table = container.querySelector("table");
    expect(table).toBeTruthy();
    const headerCells = [...(table?.querySelectorAll("thead th") ?? [])].map((c) => c.textContent);
    expect(headerCells).toEqual(["Name", "Role"]);
    const bodyRows = [...(table?.querySelectorAll("tbody tr") ?? [])].map((row) =>
      [...row.querySelectorAll("td")].map((c) => c.textContent),
    );
    expect(bodyRows).toEqual([
      ["Ada", "Engineer"],
      ["Grace", "Admiral"],
    ]);
  });

  describe("security — untrusted LLM content", () => {
    it("never injects raw HTML: a <script> tag renders as inert text, not an executed element", () => {
      const { container } = render(
        <MosaicMarkdown content={"before <script>window.__pwned = true;</script> after"} />,
      );
      expect(container.querySelector("script")).toBeNull();
      expect((globalThis as { __pwned?: boolean }).__pwned).toBeUndefined();
      expect(container.textContent).toContain("<script>window.__pwned = true;</script>");
    });

    it("never sets dangerouslySetInnerHTML anywhere in the rendered tree", () => {
      const { container } = render(<MosaicMarkdown content={"<img src=x onerror=alert(1)>"} />);
      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
    });

    it("does not render a javascript: link href — the scheme is stripped, text is kept", () => {
      const { container } = render(<MosaicMarkdown content={"[click me](javascript:alert(1))"} />);
      const link = container.querySelector("a");
      expect(link).toBeNull();
      expect(screen.getByText("click me")).toBeTruthy();
    });

    it("does not render a data:text/html link href", () => {
      const { container } = render(
        <MosaicMarkdown content={"[open](data:text/html,<script>alert(1)</script>)"} />,
      );
      expect(container.querySelector("a")).toBeNull();
      expect(screen.getByText("open")).toBeTruthy();
    });

    describe("control-character-obfuscated schemes (sanitizeHref must reject these unaided)", () => {
      // Payloads are built with String.fromCharCode so the literal
      // "javascript:" / "data:" substring is assembled at runtime rather than
      // written as a plain literal — the assertion exercises the actual
      // string content sanitizeHref receives, matching the real-world
      // obfuscation vector (control char inserted mid-scheme), not merely a
      // linter-visible token.
      const TAB = String.fromCharCode(9);
      const LF = String.fromCharCode(10);
      const CR = String.fromCharCode(13);
      const NUL = String.fromCharCode(0);

      it.each([
        ["internal TAB", TAB],
        ["internal LF", LF],
        ["internal CR", CR],
        ["internal NUL", NUL],
      ])("rejects javascript: scheme obfuscated with %s", (_label, ctrl) => {
        const href = `java${ctrl}script:alert(1)`;
        const { container } = render(<MosaicMarkdown content={`[click me](${href})`} />);
        expect(container.querySelector("a")).toBeNull();
        expect(screen.getByText("click me")).toBeTruthy();
      });

      it.each([
        ["internal TAB", TAB],
        ["internal LF", LF],
        ["internal CR", CR],
        ["internal NUL", NUL],
      ])("rejects data: scheme obfuscated with %s", (_label, ctrl) => {
        const href = `da${ctrl}ta:text/html,<script>alert(1)</script>`;
        const { container } = render(<MosaicMarkdown content={`[open](${href})`} />);
        expect(container.querySelector("a")).toBeNull();
        expect(screen.getByText("open")).toBeTruthy();
      });
    });
  });
});
