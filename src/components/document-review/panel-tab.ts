/**
 * The tabs of a document-review panel, named by ROLE (never by a business noun).
 *
 * - "compare"  document and fields side by side — the INITIAL tab.
 * - "document" the document alone.
 * - "row"      the row's fields alone.
 */
export type ReviewPanelTab = "compare" | "document" | "row";

export const REVIEW_PANEL_TABS: readonly ReviewPanelTab[] = ["compare", "document", "row"];

/** A panel opens on Compare: reading the document and editing the fields at once is the point. */
export const INITIAL_REVIEW_PANEL_TAB: ReviewPanelTab = "compare";
