"use client";

/**
 * MosaicI18nProvider — i18next context provider for @vantageos/mosaic-blocks
 *
 * Mirrors the MosaicThemeProvider conventions: thin wrapper, "use client",
 * ref-free (no DOM node produced — pure context boundary), props spread via
 * a typed interface. Bootstraps an i18next instance scoped to mosaic-blocks'
 * own locale namespace (EN/FR bundled in src/i18n/locales/*.json) — this repo
 * does NOT depend on @vantageos/mosaic-i18n (different repo, different keys).
 *
 * Descendants read the instance via useMosaicT().
 */

import i18next from "i18next";
import * as React from "react";
import { MosaicI18nContext } from "./MosaicI18nContext.js";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export interface MosaicI18nProviderProps {
  children: React.ReactNode;
  /** Active locale. Defaults to "en". */
  locale?: "en" | "fr";
}

const bundledResources = {
  en: { translation: en },
  fr: { translation: fr },
};

/**
 * MosaicI18nProvider — wraps children with a mosaic-blocks i18next instance.
 *
 * @example
 * <MosaicI18nProvider locale="fr">
 *   <MosaicNavbar logo={<Logo />} links={links} />
 * </MosaicI18nProvider>
 */
export function MosaicI18nProvider({ children, locale = "en" }: MosaicI18nProviderProps) {
  const instance = React.useMemo(() => {
    const created = i18next.createInstance();
    void created.init({
      lng: locale,
      fallbackLng: "en",
      resources: bundledResources,
      interpolation: { escapeValue: false },
      initImmediate: false,
    });
    return created;
  }, [locale]);

  return <MosaicI18nContext.Provider value={instance}>{children}</MosaicI18nContext.Provider>;
}

MosaicI18nProvider.displayName = "MosaicI18nProvider";
