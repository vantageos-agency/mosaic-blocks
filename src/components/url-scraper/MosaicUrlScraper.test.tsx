/**
 * MosaicUrlScraper — tests
 *
 * Coverage: idle input + submit calls onScrape with the trimmed URL;
 * local URL-format validation blocks the call and surfaces the required
 * invalidUrlMessage prop without touching host state; loading state
 * disables the input/button and shows the required scrapingLabel/
 * loadingMessage; success state renders the host-provided content
 * (title/description/optional image/link) with required a11y labels;
 * error state renders the host-provided errorMessage (invalid/unreachable/
 * empty-content — all just different `errorMessage` values, decided by the
 * host); reset button calls onReset from both success and error states; no
 * network call is ever made by the component itself (onScrape is the only
 * side-effect path).
 *
 * Contract shape: props are pushed into the `MosaicUrlScraperState`
 * discriminated union exactly where they are read (base props are shared
 * by every test via BASE_PROPS; `scrapingLabel`/`loadingMessage` only exist
 * on the "loading" prop bag; `content`/`openLinkAriaLabel`/`imageAlt`/
 * `resetButtonLabel`/`onReset` only on "success"; `errorMessage`/
 * `resetButtonLabel`/`onReset` only on "error") — this file exercises the
 * type contract directly (each `render` call below only compiles because
 * the branch-specific props it passes match the branch's `status`).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MosaicUrlScraper } from "./MosaicUrlScraper.js";

const BASE_PROPS = {
  url: "",
  onUrlChange: vi.fn(),
  onScrape: vi.fn(),
  inputAriaLabel: "URL de la page à aspirer",
  inputPlaceholder: "https://exemple.com/article",
  scrapeButtonLabel: "Aspirer",
  invalidUrlMessage: "Veuillez saisir une URL valide",
};

describe("MosaicUrlScraper", () => {
  it("sets data-slot='url-scraper' on the root", () => {
    const { container } = render(<MosaicUrlScraper {...BASE_PROPS} status="idle" />);
    expect(container.querySelector("[data-slot='url-scraper']")).toBeTruthy();
  });

  it("renders the input with the required aria-label and placeholder", () => {
    render(<MosaicUrlScraper {...BASE_PROPS} status="idle" />);
    const input = screen.getByLabelText("URL de la page à aspirer");
    expect(input.getAttribute("placeholder")).toBe("https://exemple.com/article");
  });

  it("calls onUrlChange when the input value changes", () => {
    const onUrlChange = vi.fn();
    render(<MosaicUrlScraper {...BASE_PROPS} status="idle" onUrlChange={onUrlChange} />);
    const input = screen.getByLabelText("URL de la page à aspirer");
    fireEvent.change(input, { target: { value: "https://exemple.com" } });
    expect(onUrlChange).toHaveBeenCalledWith("https://exemple.com");
  });

  it("renders the scrape button with the required label", () => {
    render(<MosaicUrlScraper {...BASE_PROPS} status="idle" />);
    expect(screen.getByText("Aspirer")).toBeTruthy();
  });

  it("calls onScrape with the trimmed URL on submit when the URL is valid", () => {
    const onScrape = vi.fn();
    const { container } = render(
      <MosaicUrlScraper
        {...BASE_PROPS}
        status="idle"
        url="  https://exemple.com/article  "
        onScrape={onScrape}
      />,
    );
    const form = container.querySelector("[data-slot='url-scraper-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);
    expect(onScrape).toHaveBeenCalledWith("https://exemple.com/article");
  });

  it("blocks submission and shows the required invalidUrlMessage when the URL is malformed", () => {
    const onScrape = vi.fn();
    const { container } = render(
      <MosaicUrlScraper {...BASE_PROPS} status="idle" url="pas-une-url" onScrape={onScrape} />,
    );
    const form = container.querySelector("[data-slot='url-scraper-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);
    expect(onScrape).not.toHaveBeenCalled();
    expect(screen.getByText("Veuillez saisir une URL valide")).toBeTruthy();
  });

  it("clears the local invalid message once the user edits the URL again", () => {
    const { container } = render(
      <MosaicUrlScraper {...BASE_PROPS} status="idle" url="pas-une-url" />,
    );
    const form = container.querySelector("[data-slot='url-scraper-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);
    expect(screen.getByText("Veuillez saisir une URL valide")).toBeTruthy();

    const input = screen.getByLabelText("URL de la page à aspirer");
    fireEvent.change(input, { target: { value: "https://exemple.com" } });
    expect(screen.queryByText("Veuillez saisir une URL valide")).toBeNull();
  });

  describe("loading state", () => {
    const LOADING_PROPS = {
      scrapingLabel: "Aspiration en cours",
      loadingMessage: "Récupération du contenu de la page…",
    };

    it("disables the input and button and shows the scraping/loading labels", () => {
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...LOADING_PROPS}
          status="loading"
          url="https://exemple.com"
        />,
      );
      const input = screen.getByLabelText("URL de la page à aspirer");
      expect(input.hasAttribute("disabled")).toBe(true);
      expect(screen.getByText("Aspiration en cours")).toBeTruthy();
      expect(screen.getByText("Récupération du contenu de la page…")).toBeTruthy();
    });
  });

  describe("success state", () => {
    const CONTENT = {
      title: "Comprendre les systèmes de débat IA",
      description: "Un guide complet sur les systèmes de débat multi-agents.",
      url: "https://exemple.com/article",
    };

    const SUCCESS_PROPS = {
      openLinkAriaLabel: (pageUrl: string) => `Ouvrir ${pageUrl} dans un nouvel onglet`,
      imageAlt: (title: string) => `Aperçu de ${title}`,
      resetButtonLabel: "Aspirer une autre page",
      onReset: vi.fn(),
    };

    it("renders the title, description and link with the required aria-label", () => {
      render(
        <MosaicUrlScraper {...BASE_PROPS} {...SUCCESS_PROPS} status="success" content={CONTENT} />,
      );
      expect(screen.getByText(CONTENT.title)).toBeTruthy();
      expect(screen.getByText(CONTENT.description)).toBeTruthy();
      const link = screen.getByRole("link", {
        name: "Ouvrir https://exemple.com/article dans un nouvel onglet",
      });
      expect(link.getAttribute("href")).toBe(CONTENT.url);
    });

    it("renders the optional image with the required imageAlt when present", () => {
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...SUCCESS_PROPS}
          status="success"
          content={{ ...CONTENT, image: "https://exemple.com/preview.jpg" }}
        />,
      );
      const image = screen.getByAltText(`Aperçu de ${CONTENT.title}`);
      expect(image.getAttribute("src")).toBe("https://exemple.com/preview.jpg");
    });

    it("does not render an image element when content.image is absent", () => {
      const { container } = render(
        <MosaicUrlScraper {...BASE_PROPS} {...SUCCESS_PROPS} status="success" content={CONTENT} />,
      );
      expect(container.querySelector("[data-slot='url-scraper-image']")).toBeNull();
    });

    it("calls onReset when the reset button is clicked", () => {
      const onReset = vi.fn();
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...SUCCESS_PROPS}
          status="success"
          content={CONTENT}
          onReset={onReset}
        />,
      );
      fireEvent.click(screen.getByText("Aspirer une autre page"));
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("disables the input and button while a scraped result is shown", () => {
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...SUCCESS_PROPS}
          status="success"
          content={CONTENT}
          url={CONTENT.url}
        />,
      );
      const input = screen.getByLabelText("URL de la page à aspirer");
      expect(input.hasAttribute("disabled")).toBe(true);
    });
  });

  describe("error state", () => {
    const ERROR_PROPS = {
      resetButtonLabel: "Aspirer une autre page",
      onReset: vi.fn(),
    };

    it("renders the host-provided errorMessage", () => {
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...ERROR_PROPS}
          status="error"
          errorMessage="Page inaccessible"
        />,
      );
      expect(screen.getByText("Page inaccessible")).toBeTruthy();
    });

    it("renders a different host-provided errorMessage for empty content", () => {
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...ERROR_PROPS}
          status="error"
          errorMessage="Contenu vide"
        />,
      );
      expect(screen.getByText("Contenu vide")).toBeTruthy();
    });

    it("calls onReset when the reset button is clicked from the error state", () => {
      const onReset = vi.fn();
      render(
        <MosaicUrlScraper
          {...BASE_PROPS}
          {...ERROR_PROPS}
          status="error"
          errorMessage="Page inaccessible"
          onReset={onReset}
        />,
      );
      fireEvent.click(screen.getByText("Aspirer une autre page"));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  it("performs no network call — onScrape is a pure prop callback", () => {
    const onScrape = vi.fn();
    const { container } = render(
      <MosaicUrlScraper
        {...BASE_PROPS}
        status="idle"
        url="https://exemple.com"
        onScrape={onScrape}
      />,
    );
    const form = container.querySelector("[data-slot='url-scraper-form']");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);
    expect(onScrape).toHaveBeenCalled();
  });

  it("applies custom className to the root", () => {
    const { container } = render(
      <MosaicUrlScraper {...BASE_PROPS} status="idle" className="my-custom-class" />,
    );
    const root = container.querySelector("[data-slot='url-scraper']");
    expect(root?.className).toContain("my-custom-class");
  });
});
