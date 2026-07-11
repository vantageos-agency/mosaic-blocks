/**
 * useMosaicT — i18n translation hook for @vantageos/mosaic-blocks
 *
 * Reads the nearest MosaicI18nProvider context and returns a `t(key, params?)`
 * function bound to i18next. Component authors never inline English strings —
 * only translation KEYS. All strings live in src/i18n/locales/*.json.
 *
 * When no MosaicI18nProvider is mounted, falls back to a standalone i18next
 * instance bootstrapped with the bundled EN locale DATA (not a hardcoded
 * string in a component). This keeps components usable in isolation (tests,
 * storybook, consumer apps that forgot to wrap the provider) without ever
 * hardcoding an English default inline in a component.
 */

import i18next, { type i18n as I18nInstance } from "i18next";
import * as React from "react";
import { MosaicI18nContext } from "./MosaicI18nContext.js";
import en from "./locales/en.json";

export type MosaicTranslateParams = Record<string, string | number>;
export type MosaicT = (key: string, params?: MosaicTranslateParams) => string;

let fallbackInstance: I18nInstance | undefined;

function getFallbackInstance(): I18nInstance {
  if (!fallbackInstance) {
    const instance = i18next.createInstance();
    void instance.init({
      lng: "en",
      fallbackLng: "en",
      resources: { en: { translation: en } },
      interpolation: { escapeValue: false },
      initImmediate: false,
    });
    fallbackInstance = instance;
  }
  return fallbackInstance;
}

/**
 * useMosaicT — returns a `t(key, params?)` translation function.
 *
 * @example
 * const t = useMosaicT();
 * <nav aria-label={t('Navbar.aria.main')}>
 */
export function useMosaicT(): MosaicT {
  const contextInstance = React.useContext(MosaicI18nContext);
  const instance = contextInstance ?? getFallbackInstance();

  return React.useCallback<MosaicT>((key, params) => instance.t(key, params) as string, [instance]);
}
