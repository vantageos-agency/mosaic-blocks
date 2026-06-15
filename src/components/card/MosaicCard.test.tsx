/**
 * MosaicCard — RED-first TDD
 *
 * Run 1: RED (no impl yet)
 * Run 2: GREEN (after MosaicCard.tsx exists)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  MosaicCard,
  MosaicCardContent,
  MosaicCardDescription,
  MosaicCardFooter,
  MosaicCardHeader,
  MosaicCardTitle,
} from "./MosaicCard.js";

describe("MosaicCard", () => {
  it("renders a div with data-slot='card'", () => {
    render(<MosaicCard data-testid="card">content</MosaicCard>);
    const el = screen.getByTestId("card");
    expect(el.getAttribute("data-slot")).toBe("card");
  });

  it("accepts and applies additional className", () => {
    render(
      <MosaicCard data-testid="card" className="custom-class">
        content
      </MosaicCard>,
    );
    expect(screen.getByTestId("card").className).toContain("custom-class");
  });

  it("renders children", () => {
    render(<MosaicCard data-testid="card">Hello Card</MosaicCard>);
    expect(screen.getByText("Hello Card")).toBeTruthy();
  });
});

describe("MosaicCardHeader", () => {
  it("renders with data-slot='card-header'", () => {
    render(<MosaicCardHeader data-testid="header">header</MosaicCardHeader>);
    expect(screen.getByTestId("header").getAttribute("data-slot")).toBe("card-header");
  });
});

describe("MosaicCardTitle", () => {
  it("renders with data-slot='card-title'", () => {
    render(<MosaicCardTitle data-testid="title">My Title</MosaicCardTitle>);
    expect(screen.getByTestId("title").getAttribute("data-slot")).toBe("card-title");
  });

  it("renders children text", () => {
    render(<MosaicCardTitle data-testid="title">Title text</MosaicCardTitle>);
    expect(screen.getByText("Title text")).toBeTruthy();
  });
});

describe("MosaicCardDescription", () => {
  it("renders with data-slot='card-description'", () => {
    render(<MosaicCardDescription data-testid="desc">desc</MosaicCardDescription>);
    expect(screen.getByTestId("desc").getAttribute("data-slot")).toBe("card-description");
  });
});

describe("MosaicCardContent", () => {
  it("renders with data-slot='card-content'", () => {
    render(<MosaicCardContent data-testid="content">content</MosaicCardContent>);
    expect(screen.getByTestId("content").getAttribute("data-slot")).toBe("card-content");
  });
});

describe("MosaicCardFooter", () => {
  it("renders with data-slot='card-footer'", () => {
    render(<MosaicCardFooter data-testid="footer">footer</MosaicCardFooter>);
    expect(screen.getByTestId("footer").getAttribute("data-slot")).toBe("card-footer");
  });
});

describe("MosaicCard composition", () => {
  it("composes all sub-parts", () => {
    render(
      <MosaicCard data-testid="card">
        <MosaicCardHeader data-testid="header">
          <MosaicCardTitle data-testid="title">Title</MosaicCardTitle>
          <MosaicCardDescription data-testid="desc">Description</MosaicCardDescription>
        </MosaicCardHeader>
        <MosaicCardContent data-testid="content">Body</MosaicCardContent>
        <MosaicCardFooter data-testid="footer">Footer</MosaicCardFooter>
      </MosaicCard>,
    );
    expect(screen.getByTestId("card").getAttribute("data-slot")).toBe("card");
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });
});
