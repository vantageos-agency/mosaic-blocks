/**
 * MosaicTestimonialsGrid — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicTestimonialsGrid } from "./MosaicTestimonialsGrid.js";

afterEach(() => cleanup());

describe("MosaicTestimonialsGrid", () => {
  const testimonials = [
    {
      id: "t1",
      quote: "This product changed everything.",
      author: "Alice Martin",
      role: "CTO",
    },
    {
      id: "t2",
      quote: "We ship twice as fast now.",
      author: "Bob Chen",
      role: "Lead Dev",
    },
  ];

  it("renders without crashing", () => {
    render(<MosaicTestimonialsGrid testimonials={testimonials} />);
  });

  it("renders all quotes", () => {
    render(<MosaicTestimonialsGrid testimonials={testimonials} />);
    expect(screen.getByText("This product changed everything.")).toBeDefined();
    expect(screen.getByText("We ship twice as fast now.")).toBeDefined();
  });

  it("renders all author names", () => {
    render(<MosaicTestimonialsGrid testimonials={testimonials} />);
    expect(screen.getByText("Alice Martin")).toBeDefined();
    expect(screen.getByText("Bob Chen")).toBeDefined();
  });

  it("renders all roles", () => {
    render(<MosaicTestimonialsGrid testimonials={testimonials} />);
    expect(screen.getByText("CTO")).toBeDefined();
    expect(screen.getByText("Lead Dev")).toBeDefined();
  });
});
