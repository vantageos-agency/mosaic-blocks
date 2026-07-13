/**
 * MosaicResizableSplitPane — presentational resizable two-pane layout
 *
 * Presentational content-level split, forming a pair with `MosaicPdfViewer`
 * (`main` = document preview, `side` = the edit panel next to it). The pattern
 * it replaces shows the document in a modal — so the reviewer sees the
 * document OR edits fields, never both at once. This component removes that
 * modal round-trip: `main` and `side` render side by side, and the boundary
 * between them is draggable.
 *
 * Fully host-controlled, exactly like `MosaicPdfViewer`'s page/zoom pair:
 * `sideWidth`/`onSideWidthChange` and `isSideCollapsed`/`onToggleSideCollapsed`
 * are independent controlled pairs — the component never keeps its own copy
 * of width or collapsed state, it only reports drag/keyboard/click intents
 * via callbacks. No business data lives in this contract: it only knows
 * `main` / `side` / dimensions — same pattern noted in the property contract
 * ("generalisable car aucune donnée métier dans le contrat de props").
 *
 * Distinct from `MosaicDashboardLayout`: that component owns the app SHELL
 * (header, sidebar, mobile drawer). This one owns CONTENT layout only — it
 * has no header, no navigation, no app-level concept, and composes *inside*
 * a page (or inside `MosaicDashboardLayout`'s children slot).
 *
 * Drag is implemented with plain `pointerdown`/`pointermove`/`pointerup`
 * listeners (no split-pane library dependency — matches the
 * `MosaicPdfViewer`/`MosaicUrlScraper` convention of leaning on browser
 * primitives instead of adding a runtime dependency). `pointerdown` is
 * attached via the JSX `onPointerDown` prop on the handle (React does
 * delegate pointer events); `pointermove`/`pointerup` are attached with a
 * plain `addEventListener` on `window` inside a `useEffect`, because the drag
 * must keep tracking the pointer even once it leaves the handle's bounds —
 * mirrors `MosaicPdfViewer`'s native-listener rationale (JSDoc there), here
 * applied because the *drag gesture* — not a single element's native event —
 * needs to outlive the handle's own DOM bounds.
 *
 * The resize handle is `role="separator"` with `aria-orientation="vertical"`,
 * `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, and `tabIndex={0}` — it is
 * reachable and operable by keyboard alone (ArrowLeft/ArrowRight adjust
 * `sideWidth` by a fixed step), never mouse-only. This is a daily working
 * screen — a mouse-only resize handle would be a real accessibility defect,
 * not a nicety.
 *
 * Pattern: MosaicPdfViewer.tsx / MosaicSlider.tsx (data-slot, inline cn,
 * React 19 ref prop, displayName, JSDoc, pure variants module, presentational
 * — host owns width/collapsed state, no split-pane library dependency).
 * No "use client" in source — prepend-use-client.mjs adds it to dist; the
 * `useRef`/`useEffect` below require the client runtime at use-time.
 * Design tokens: --border, --accent, --ring.
 * No icon library — plain glyphs ("‹"/"›"), matching the
 * pdf-viewer/dashboard-layout convention (no lucide-react runtime dependency).
 * Bilingual: every user-facing string (`collapseButtonAriaLabel` /
 * `resizeHandleAriaLabel`) is a required caller-supplied prop — zero
 * hardcoded copy, zero default.
 *
 * @example
 * <MosaicResizableSplitPane
 *   main={<MosaicPdfViewer fileUrl={documentUrl} loadingLabel="…" errorLabel="…" />}
 *   side={<DocumentEditPanel />}
 *   sideWidth={sideWidth}
 *   onSideWidthChange={setSideWidth}
 *   isSideCollapsed={isSideCollapsed}
 *   onToggleSideCollapsed={() => setIsSideCollapsed((c) => !c)}
 *   collapseButtonAriaLabel="Replier le panneau latéral"
 *   resizeHandleAriaLabel="Redimensionner le panneau latéral"
 * />
 */

import type * as React from "react";
import { useEffect, useRef } from "react";
import {
  splitPaneCollapseButtonVariants,
  splitPaneHandleVariants,
  splitPaneRootVariants,
} from "./split-pane-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Merges an external React-19 ref prop with an internally-held ref. */
function mergeRefs<T>(externalRef: React.Ref<T> | undefined, node: T | null) {
  if (typeof externalRef === "function") {
    externalRef(node);
  } else if (externalRef && typeof externalRef === "object") {
    (externalRef as React.MutableRefObject<T | null>).current = node;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_SIDE_WIDTH = 30;
const MIN_SIDE_WIDTH = 15;
const MAX_SIDE_WIDTH = 70;
const KEYBOARD_STEP = 5;

function clampSideWidth(width: number): number {
  return Math.min(MAX_SIDE_WIDTH, Math.max(MIN_SIDE_WIDTH, width));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicResizableSplitPaneProps {
  /** Main pane content (e.g. a document preview). */
  main: React.ReactNode;
  /** Side pane content (e.g. an edit panel). Hidden when `isSideCollapsed`. */
  side: React.ReactNode;
  /** Side pane width as a percentage of the container, controlled by the host. */
  sideWidth?: number;
  /** Called with the requested width (percentage) while dragging the handle or using arrow keys. */
  onSideWidthChange?: (width: number) => void;
  /** Whether the side pane is collapsed, controlled by the host. */
  isSideCollapsed?: boolean;
  /** Called when the collapse/expand button is activated. */
  onToggleSideCollapsed?: () => void;
  /** Accessible label for the collapse/expand button. Required, no default. */
  collapseButtonAriaLabel: string;
  /** Accessible label for the resize handle. Required, no default. */
  resizeHandleAriaLabel: string;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicResizableSplitPane — production resizable content-split layout for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders `main`/`side` side by side, reports drag and
 * keyboard resize intents via `onSideWidthChange`, and reports collapse
 * intent via `onToggleSideCollapsed`. No split-pane library dependency, no
 * local width/collapsed state, no built-in copy.
 */
export function MosaicResizableSplitPane({
  main,
  side,
  sideWidth = DEFAULT_SIDE_WIDTH,
  onSideWidthChange,
  isSideCollapsed = false,
  onToggleSideCollapsed,
  collapseButtonAriaLabel,
  resizeHandleAriaLabel,
  className,
  ref,
}: MosaicResizableSplitPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Drag tracking must outlive the handle's own bounds (the pointer can move
  // past the handle mid-drag) — attached on `window`, cleaned up on unmount.
  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!isDraggingRef.current) return;
      const rootNode = rootRef.current;
      if (!rootNode || onSideWidthChange === undefined) return;
      const rect = rootNode.getBoundingClientRect();
      if (rect.width === 0) return;
      const distanceFromRight = rect.right - event.clientX;
      const rawWidth = (distanceFromRight / rect.width) * 100;
      onSideWidthChange(clampSideWidth(rawWidth));
    }
    function handlePointerUp() {
      isDraggingRef.current = false;
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onSideWidthChange]);

  function handleHandlePointerDown() {
    isDraggingRef.current = true;
  }

  function handleHandleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (onSideWidthChange === undefined) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onSideWidthChange(clampSideWidth(sideWidth - KEYBOARD_STEP));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onSideWidthChange(clampSideWidth(sideWidth + KEYBOARD_STEP));
    }
  }

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        mergeRefs(ref, node);
      }}
      data-slot="resizable-split-pane"
      className={cn(splitPaneRootVariants(), className)}
    >
      <div data-slot="resizable-split-pane-main" className="min-h-0 min-w-0 flex-1 overflow-auto">
        {main}
      </div>

      {!isSideCollapsed && (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(sideWidth)}
            aria-valuemin={MIN_SIDE_WIDTH}
            aria-valuemax={MAX_SIDE_WIDTH}
            aria-label={resizeHandleAriaLabel}
            tabIndex={0}
            data-slot="resizable-split-pane-handle"
            onPointerDown={handleHandlePointerDown}
            onKeyDown={handleHandleKeyDown}
            className={splitPaneHandleVariants()}
          />
          <div
            data-slot="resizable-split-pane-side"
            style={{ width: `${sideWidth}%` }}
            className="min-h-0 shrink-0 overflow-auto"
          >
            {side}
          </div>
        </>
      )}

      <button
        type="button"
        data-slot="resizable-split-pane-collapse-button"
        aria-label={collapseButtonAriaLabel}
        aria-expanded={!isSideCollapsed}
        onClick={onToggleSideCollapsed}
        className={splitPaneCollapseButtonVariants()}
      >
        {isSideCollapsed ? "‹" : "›"}
      </button>
    </div>
  );
}

MosaicResizableSplitPane.displayName = "MosaicResizableSplitPane";
