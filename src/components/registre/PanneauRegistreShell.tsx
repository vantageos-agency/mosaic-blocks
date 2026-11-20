/**
 * PanneauRegistreShell — the ONE drawer shell every registry screen's side panel
 * mounts. It owns the HeroUI Drawer, the left-edge resize handle, the
 * ArrowUp/ArrowDown row navigation, the header band and the prev/next footer.
 * The body is supplied as `children`: the mounting screen puts the ROW'S FIELDS
 * FIRST there.
 *
 * Why one shell: two separately written panels drift apart on the frame, and a
 * panel that mounts a tall control first pushes every field below the fold. With
 * one shell, a new registry panel cannot diverge on the frame.
 *
 * `Drawer.Content`'s published props carry no `style` slot, so the resizable
 * width rides a CSS variable on a scoped class. `forceWidthRatio` lets a screen
 * momentarily override the width (e.g. a compare mode) without owning the
 * resize state itself.
 */
import { Button, Drawer } from "@heroui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { isEditableTarget } from "../document-review/row-navigation.js";

const DEFAULT_WIDTH_RATIO = 0.45;
const MIN_WIDTH_PX = 360;
const MAX_WIDTH_RATIO = 0.9;

// Not user-facing text. Kept as an object-literal constant with the marker BETWEEN
// properties: esbuild strips a statement-level `//` comment, never this one.
const CSS_RULES = {
  // allow-hardcoded-word: a CSS rule (the scoped width variable), not user-facing text
  width: (px: number) => `.panneau-registre-shell { --panneau-registre-width: ${px}px; }`,
};

export interface PanneauRegistreShellLabels {
  /** Accessible name of the left-edge resize handle. */
  resizeHandle: string;
  /** Accessible name of the close trigger. */
  close: string;
  previousRow: string;
  nextRow: string;
}

export interface PanneauRegistreShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: PanneauRegistreShellLabels;
  /** The dialog's accessible name. */
  ariaLabel?: string;
  /** The header line naming the row in words. */
  contexte: string;
  /** Optional header controls (e.g. a compare toggle), left of the close trigger. */
  headerActions?: ReactNode;
  /** When set, overrides the resizable width for the duration (e.g. a compare mode). */
  forceWidthRatio?: number | null;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  /** The panel body. The mounting screen puts the ROW'S FIELDS FIRST here. */
  children: ReactNode;
}

export function PanneauRegistreShell({
  open,
  onOpenChange,
  labels,
  ariaLabel,
  contexte,
  headerActions,
  forceWidthRatio = null,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  children,
}: PanneauRegistreShellProps) {
  // null until measured on the client.
  const [widthPx, setWidthPx] = useState<number | null>(null);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    if (widthPx !== null || typeof window === "undefined") return;
    setWidthPx(Math.round(window.innerWidth * DEFAULT_WIDTH_RATIO));
  }, [widthPx]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const drag = dragStart.current;
    if (!drag) return;
    // Handle sits on the panel's LEFT edge: dragging left grows the panel.
    const dx = drag.x - e.clientX;
    const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
    setWidthPx(Math.min(maxWidth, Math.max(MIN_WIDTH_PX, drag.width + dx)));
  }, []);

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      dragStart.current = {
        x: e.clientX,
        width: widthPx ?? Math.round(window.innerWidth * DEFAULT_WIDTH_RATIO),
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [widthPx, onPointerMove, onPointerUp],
  );

  useEffect(() => () => onPointerUp(), [onPointerUp]);

  // ArrowUp/ArrowDown move to the neighbour row without closing the panel.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      if (e.key === "ArrowUp" && !prevDisabled) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowDown" && !nextDisabled) {
        e.preventDefault();
        onNext();
      }
    }
    // Capture phase: the drawer stops arrow keys from its own buttons before they bubble to window.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, prevDisabled, nextDisabled, onPrev, onNext]);

  const resolvedWidth =
    forceWidthRatio !== null && typeof window !== "undefined"
      ? Math.round(window.innerWidth * forceWidthRatio)
      : (widthPx ?? MIN_WIDTH_PX);

  const widthRule = CSS_RULES.width(resolvedWidth);

  return (
    <Drawer isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <style>{widthRule}</style>
          <Drawer.Dialog
            aria-label={ariaLabel}
            className="panneau-registre-shell relative flex h-full w-full! flex-col overflow-hidden sm:w-[var(--panneau-registre-width)]! sm:min-w-[360px]! sm:max-w-[90vw]!"
          >
            <button
              type="button"
              aria-label={labels.resizeHandle}
              className="absolute inset-y-0 left-0 hidden w-1.5 cursor-col-resize touch-none bg-transparent hover:bg-border sm:block"
              onPointerDown={onHandlePointerDown}
            />
            <Drawer.Header className="flex shrink-0 flex-row items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-muted-foreground">{contexte}</p>
              <div className="flex shrink-0 flex-row items-center gap-2">
                {headerActions}
                <Drawer.CloseTrigger aria-label={labels.close} />
              </div>
            </Drawer.Header>
            {children}
            <Drawer.Footer className="flex shrink-0 flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                isIconOnly
                aria-label={labels.previousRow}
                isDisabled={prevDisabled}
                onPress={onPrev}
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                isIconOnly
                aria-label={labels.nextRow}
                isDisabled={nextDisabled}
                onPress={onNext}
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
