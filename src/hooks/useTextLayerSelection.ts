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
      layer.querySelector<HTMLElement>('.pressStart')?.removeAttribute('style');
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

    // A press on empty space beside the text starts the selection inside a `.pressStart`
    // block: an empty block that lies under the text and covers the whole layer. On the
    // press, it is moved right after the text of the line under the pointer (or of
    // the line above, between lines), or right before that line when the press is to its
    // left. So the selection starts there, as on a normal page. Without it the press
    // hits the layer itself, and Chrome before 148 starts the selection at the end of
    // the page: dragging back or up from there selected the whole page.
    const pressCover = (layer: HTMLElement) => {
      let cover = layer.querySelector<HTMLElement>('.pressStart');
      if (!cover) {
        cover = document.createElement('div');
        cover.className = 'pressStart';
        cover.setAttribute('aria-hidden', 'true');
        layer.append(cover);
      }
      return cover;
    };

    const placeForPress = (layer: HTMLElement, cover: HTMLElement, x: number, y: number) => {
      const spans = Array.from(layer.querySelectorAll<HTMLElement>('span[role="presentation"]')).filter(
        (span) => span.textContent?.trim(),
      );
      if (spans.length === 0) return;
      const rects = spans.map((span) => span.getBoundingClientRect());
      let line = rects.flatMap((r, i) => (r.top <= y && y <= r.bottom ? [i] : []));
      if (line.length === 0) {
        const above = rects.flatMap((r, i) => (r.bottom < y ? [i] : []));
        if (above.length === 0) {
          spans[0].before(cover);
          return;
        }
        const bottom = Math.max(...above.map((i) => rects[i].bottom));
        line = above.filter((i) => bottom - rects[i].bottom < rects[i].height / 2);
        x = Infinity;
      }
      const left = line.filter((i) => rects[i].left <= x);
      if (left.length === 0) spans[Math.min(...line)].before(cover);
      else spans[Math.max(...left)].after(cover);
    };

    const onPointerOver = (event: PointerEvent) => {
      // Fingers select with a long press and the system handles: no press block for them.
      if (event.pointerType !== 'mouse') return;
      if (!(event.target instanceof Element)) return;
      const layer = event.target.closest<HTMLElement>('.textLayer');
      if (layer && stageRef.current?.contains(layer)) pressCover(layer);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      prevRange = null;
      layers().forEach(reset);
      if (!(event.target instanceof Element)) return;
      const layer = event.target.closest<HTMLElement>('.textLayer');
      if (!layer) return;
      layer.classList.add('selecting');
      if (event.pointerType !== 'mouse') {
        layer.querySelector('.pressStart')?.remove();
        return;
      }
      const cover = pressCover(layer);
      const end = layer.querySelector<HTMLElement>('.endOfContent');
      const onEnd = end != null && event.target === end;
      const plainPress = event.pointerType === 'mouse' && event.button === 0 && !event.shiftKey;
      if (plainPress && (event.target === cover || event.target === layer || onEnd)) {
        // A plain press starts a new selection anyway. Drop the old one first: it may
        // still start inside this block, and moving the block would drag it along.
        document.getSelection()?.removeAllRanges();
        placeForPress(layer, cover, event.clientX, event.clientY);
        // Start the end-of-content block at the same spot. It takes the press itself when an
        // old selection was showing, and the first move of the drag before any selection
        // change could place it.
        if (end) {
          end.style.width = layer.style.width;
          end.style.height = layer.style.height;
          end.style.userSelect = 'text';
          cover.after(end);
        }
        // Chrome looks up the press point again when the drag starts. Shrink the block to
        // that point and lift it over the end-of-content block, so the lookup lands here
        // again while the rest of the empty space is left to pdf.js's logic below.
        const box = layer.getBoundingClientRect();
        const scale = layer.offsetWidth / (box.width || 1);
        cover.style.inset = 'auto';
        cover.style.left = `${(event.clientX - box.left) * scale - 2}px`;
        cover.style.top = `${(event.clientY - box.top) * scale - 2}px`;
        cover.style.width = '4px';
        cover.style.height = '4px';
        cover.style.zIndex = '1';
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
      // A bare caret left after a click is no selection: drop the cover so the next
      // press starts from a clean layer.
      if (!selection || selection.rangeCount === 0 || all.length === 0 || (selection.isCollapsed && !pointerDown)) {
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

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('blur', onPointerUp);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('blur', onPointerUp);
    };
  }, [stageRef]);
}
