import { useEffect, type RefObject } from 'react';

/**
 * Keeps a selection in the PDF text layer to the words under the finger or cursor.
 *
 * The text layer is a stack of absolutely placed spans with empty gaps between them.
 * When a drag (or a phone's selection handle) passes over a gap, the browser has no
 * text there and jumps the selection to the end of the page. pdf.js's own viewer fixes
 * this with an `.endOfContent` block that covers the gaps while selecting, and that it
 * moves next to the selection's moving end. react-pdf adds the block but only toggles
 * it for mouse presses, so touch selection and older browsers still select the page.
 * This is the viewer's logic, for every pointer type.
 */
type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function caretAt(x: number, y: number) {
  const doc = document as CaretDocument;
  if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }
  const range = doc.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * The text position a mouse at (x, y) should select up to: inside the nearest line of
 * text, never the gap or the empty page below it. Without this, dragging up or down
 * through the space between lines makes the browser select to the end of the page.
 */
function nearestTextPoint(layer: HTMLElement, x: number, y: number) {
  let best: { span: HTMLElement; rect: DOMRect; score: number } | null = null;
  for (const span of layer.querySelectorAll<HTMLElement>('span')) {
    const node = span.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE || !(node as Text).data.trim()) continue;
    const rect = span.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
    const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    // The line under the pointer wins over a closer span on another line.
    const score = dy * 1000 + dx;
    if (!best || score < best.score) best = { span, rect, score };
  }
  if (!best) return null;

  const text = best.span.firstChild as Text;
  if (x <= best.rect.left) return { node: text, offset: 0 };
  if (x >= best.rect.right) return { node: text, offset: text.data.length };
  const caret = caretAt(x, best.rect.top + best.rect.height / 2);
  if (caret && caret.node === text) return caret;
  return { node: text, offset: x - best.rect.left < best.rect.width / 2 ? 0 : text.data.length };
}

export function useTextLayerSelection(stageRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const layers = () =>
      Array.from(stageRef.current?.querySelectorAll<HTMLElement>('.textLayer') ?? []);

    const reset = (layer: HTMLElement) => {
      const end = layer.querySelector<HTMLElement>('.endOfContent');
      if (end) {
        layer.append(end);
        end.style.width = '';
        end.style.height = '';
        end.style.userSelect = '';
      }
      layer.classList.remove('selecting');
    };

    let pointerDown = false;
    let prevRange: Range | null = null;
    // Mouse drags only: on touch the system's selection handles already stick to text.
    let mouseDrag: { layer: HTMLElement; x: number; y: number } | null = null;
    let modernEngine: boolean | undefined;

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      const layer = event.target instanceof Element ? event.target.closest<HTMLElement>('.textLayer') : null;
      if (layer && stageRef.current?.contains(layer)) {
        layer.classList.add('selecting');
        if (event.pointerType === 'mouse' && event.button === 0) {
          mouseDrag = { layer, x: event.clientX, y: event.clientY };
        }
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!mouseDrag) return;
      mouseDrag.x = event.clientX;
      mouseDrag.y = event.clientY;
    };
    const onPointerUp = () => {
      pointerDown = false;
      mouseDrag = null;
      layers().forEach(reset);
    };

    // Keeps the moving end of a mouse selection on the text nearest the pointer.
    const clampToPointer = (selection: Selection) => {
      if (!mouseDrag || selection.rangeCount === 0 || !selection.anchorNode) return;
      if (!mouseDrag.layer.contains(selection.anchorNode)) return;
      const point = nearestTextPoint(mouseDrag.layer, mouseDrag.x, mouseDrag.y);
      if (!point) return;
      if (selection.focusNode === point.node && selection.focusOffset === point.offset) return;
      selection.extend(point.node, point.offset);
    };
    const onKeyUp = () => {
      if (!pointerDown) layers().forEach(reset);
    };

    const onSelectionChange = () => {
      const selection = document.getSelection();
      const all = layers();
      if (!selection || selection.rangeCount === 0 || all.length === 0) {
        all.forEach(reset);
        prevRange = null;
        return;
      }

      clampToPointer(selection);
      const range = selection.getRangeAt(0);
      for (const layer of all) {
        if (range.intersectsNode(layer)) layer.classList.add('selecting');
        else reset(layer);
      }

      // Firefox and Chromium 148+ keep the selection in place with the full cover alone.
      if (modernEngine === undefined) {
        const firefox = getComputedStyle(all[0]).getPropertyValue('-moz-user-select') === 'none';
        const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string; version: string }[] } })
          .userAgentData?.brands;
        const chromium =
          brands?.find(({ brand }) => brand === 'Chromium')?.version ??
          /\bChrome\/(\d+)\b/.exec(navigator.userAgent)?.[1];
        modernEngine = firefox || (!!chromium && Number.parseInt(chromium, 10) >= 148);
      }
      if (modernEngine) return;

      // Safari and older Chromium: put the cover right after the moving end of the selection.
      const modifyStart =
        prevRange != null &&
        (range.compareBoundaryPoints(Range.END_TO_END, prevRange) === 0 ||
          range.compareBoundaryPoints(Range.START_TO_END, prevRange) === 0);
      let anchor: Node | null = modifyStart ? range.startContainer : range.endContainer;
      if (anchor?.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode;
      if (anchor instanceof Element && anchor.classList.contains('highlight')) anchor = anchor.parentNode;

      if (!modifyStart && range.endOffset === 0 && anchor) {
        do {
          while (anchor && !anchor.previousSibling) anchor = anchor.parentNode;
          anchor = anchor?.previousSibling ?? null;
        } while (anchor && !anchor.childNodes.length);
      }

      const parent = anchor?.parentElement;
      const layer = parent?.closest<HTMLElement>('.textLayer');
      const end = layer?.querySelector<HTMLElement>('.endOfContent');
      if (anchor && parent && layer && end && stageRef.current?.contains(layer)) {
        end.style.width = layer.style.width;
        end.style.height = layer.style.height;
        end.style.userSelect = 'text';
        parent.insertBefore(end, modifyStart ? anchor : anchor.nextSibling);
      }
      prevRange = range.cloneRange();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('blur', onPointerUp);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('blur', onPointerUp);
    };
  }, [stageRef]);
}
