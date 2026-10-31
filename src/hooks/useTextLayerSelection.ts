import { useEffect, type RefObject } from 'react';

/**
 * Keeps a selection in the PDF text layer to the text between the press and the pointer.
 *
 * The text layer is a stack of absolutely placed spans with empty gaps between them.
 * When the pointer passes over a gap there is no text under it, so Chrome (before
 * version 148) hit-tests the layer itself and moves the selection to the end of the
 * page: dragging down or up to the next line suddenly selects everything below.
 *
 * pdf.js's own viewer fixes this with an `.endOfContent` block that covers the gaps
 * while selecting, and that it moves right next to the selection's moving end, so a
 * gap resolves to "here" instead of "end of page". react-pdf adds the block but not
 * this logic. This is the viewer's logic, run for every browser and pointer type;
 * the selection itself stays the browser's native one.
 */
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

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      if (event.target instanceof Element) {
        event.target.closest<HTMLElement>('.textLayer')?.classList.add('selecting');
      }
    };
    const onPointerUp = () => {
      pointerDown = false;
      layers().forEach(reset);
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

      const range = selection.getRangeAt(0);
      for (const layer of all) {
        if (range.intersectsNode(layer)) layer.classList.add('selecting');
        else reset(layer);
      }

      // Put the cover right after the moving end of the selection. pdf.js skips this on
      // Firefox and Chromium 148+, but it is harmless there and keeps every engine alike.

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
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('blur', onPointerUp);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('blur', onPointerUp);
    };
  }, [stageRef]);
}
