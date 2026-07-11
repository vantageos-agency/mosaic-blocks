/**
 * MosaicI18nContext — internal React context carrying the i18next instance.
 *
 * Kept in its own non-component module so MosaicI18nProvider.tsx can export
 * ONLY the component + its Props type (react-refresh/only-export-components).
 */

import type { i18n as I18nInstance } from "i18next";
import * as React from "react";

export const MosaicI18nContext = React.createContext<I18nInstance | undefined>(undefined);
