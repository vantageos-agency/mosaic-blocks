/**
 * MosaicFooterSimple — RED-first tests (T3-A Batch A)
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MosaicFooterSimple } from "./MosaicFooterSimple.js";

afterEach(() => cleanup());

describe("MosaicFooterSimple", () => {
  const columns = [
    {
      id: "col1",
      heading: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      id: "col2",
      heading: "Company",
      links: [{ label: "About", href: "#about" }],
    },
  ];

  it("renders without crashing", () => {
    render(<MosaicFooterSimple columns={columns} legal="© 2026 Mosaic" />);
  });

  it("renders column headings", () => {
    render(<MosaicFooterSimple columns={columns} legal="© 2026 Mosaic" />);
    expect(screen.getByText("Product")).toBeDefined();
    expect(screen.getByText("Company")).toBeDefined();
  });

  it("renders column links", () => {
    render(<MosaicFooterSimple columns={columns} legal="© 2026 Mosaic" />);
    expect(screen.getByText("Features")).toBeDefined();
    expect(screen.getByText("Pricing")).toBeDefined();
    expect(screen.getByText("About")).toBeDefined();
  });

  it("renders legal text", () => {
    render(<MosaicFooterSimple columns={columns} legal="© 2026 Mosaic" />);
    expect(screen.getByText("© 2026 Mosaic")).toBeDefined();
  });

  it("renders social links when provided", () => {
    render(
      <MosaicFooterSimple
        columns={columns}
        legal="© 2026 Mosaic"
        social={[{ label: "Twitter", href: "https://x.com" }]}
      />,
    );
    expect(screen.getByText("Twitter")).toBeDefined();
  });
});
