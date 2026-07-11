/**
 * useMosaicT — RED-first tests (i18n foundation)
 */
import { renderHook } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { MosaicI18nProvider } from "./MosaicI18nProvider.js";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import { useMosaicT } from "./useMosaicT.js";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

function wrapperFor(locale: "en" | "fr") {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MosaicI18nProvider, { locale, children });
}

describe("useMosaicT", () => {
  it("returns the FR string when the provider locale is fr", () => {
    const { result } = renderHook(() => useMosaicT(), { wrapper: wrapperFor("fr") });

    const label = result.current("KanbanColumn.aria.count", { count: 3 });
    expect(label).toBe("3 éléments");
    expect(label).not.toBe("3 items");
  });

  it("returns the EN string when the provider locale is en", () => {
    const { result } = renderHook(() => useMosaicT(), { wrapper: wrapperFor("en") });

    expect(result.current("KanbanColumn.aria.count", { count: 3 })).toBe("3 items");
  });

  it("falls back to bundled EN locale data when no provider is mounted", () => {
    const { result } = renderHook(() => useMosaicT());
    expect(result.current("Navbar.aria.main")).toBe("Main navigation");
  });

  it("en.json and fr.json have strictly equal key sets (parity)", () => {
    const enKeys = collectKeys(en).sort();
    const frKeys = collectKeys(fr).sort();
    expect(frKeys).toEqual(enKeys);
  });
});
