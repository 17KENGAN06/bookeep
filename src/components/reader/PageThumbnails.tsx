import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { cn } from '@/utils/cn';

/** CSS width a thumbnail is drawn for; the grid never shows one wider. */
const THUMB_WIDTH = 160;
/** Thumbnails drawn at once, so the page being read still gets the worker first. */
const PARALLEL = 2;

/**
 * Small pictures of a document's pages, drawn once and kept as blob URLs while that
 * document is open. Shared by every opening of the panel, so the second opening is instant.
 */
class ThumbStore {
  readonly urls = new Map<number, string>();
  private ratio: Promise<number> | null = null;
  private disposed = false;

  readonly pdf: PDFDocumentProxy;

  constructor(pdf: PDFDocumentProxy) {
    this.pdf = pdf;
  }

  /** Height / width of the first page: every cell takes this shape before it is drawn. */
  aspect() {
    this.ratio ??= this.pdf
      .getPage(1)
      .then((page) => {
        const viewport = page.getViewport({ scale: 1 });
        return viewport.height / viewport.width;
      })
      .catch(() => 4 / 3);
    return this.ratio;
  }

  async draw(pageNumber: number) {
    const ready = this.urls.get(pageNumber);
    if (ready) return ready;
    const page = await this.pdf.getPage(pageNumber);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (THUMB_WIDTH * pixelRatio) / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    // Not page.cleanup(): pdf.js shares this page object with the reader.
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error('Thumbnail could not be encoded');
    const url = URL.createObjectURL(blob);
    if (this.disposed) {
      URL.revokeObjectURL(url);
      throw new Error('Document closed');
    }
    this.urls.set(pageNumber, url);
    return url;
  }

  dispose() {
    this.disposed = true;
    for (const url of this.urls.values()) URL.revokeObjectURL(url);
    this.urls.clear();
  }
}

/** One store per open document; the old one is freed when the reader opens another file. */
export function useThumbStore(pdf: PDFDocumentProxy | null) {
  const [store, setStore] = useState<ThumbStore | null>(null);
  useEffect(() => {
    if (!pdf) {
      setStore(null);
      return;
    }
    const next = new ThumbStore(pdf);
    setStore(next);
    return () => next.dispose();
  }, [pdf]);
  return store;
}

type PageThumbnailsProps = {
  open: boolean;
  store: ThumbStore | null;
  totalPages: number;
  currentPage: number;
  onSelect: (page: number) => void;
  onClose: () => void;
};

export function PageThumbnails({ open, store, totalPages, currentPage, onSelect, onClose }: PageThumbnailsProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [urls, setUrls] = useState<ReadonlyMap<number, string>>(() => new Map());
  const [target, setTarget] = useState('');
  const currentRef = useRef(currentPage);
  useLayoutEffect(() => {
    currentRef.current = currentPage;
  });

  useEffect(() => {
    if (!store) return;
    let active = true;
    void store.aspect().then((value) => {
      if (active) setAspect(value);
    });
    setUrls(new Map(store.urls));
    return () => {
      active = false;
    };
  }, [store]);

  // Opening: no page scroll behind the sheet, Esc closes, focus comes back to the button.
  useEffect(() => {
    if (!open) return;
    setTarget('');
    window.getSelection()?.removeAllRanges();
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab') trapFocus(event, panelRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      root.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  // The page being read is in the middle of the grid and has focus.
  useLayoutEffect(() => {
    if (!open) return;
    const cell = gridRef.current?.querySelector<HTMLElement>(`[data-page="${currentRef.current}"]`);
    if (!cell) return;
    cell.scrollIntoView({ block: 'center' });
    cell.focus({ preventScroll: true });
  }, [open]);

  // Draws the cells in view (and a screen ahead), nearest to the reading page first.
  useEffect(() => {
    const grid = gridRef.current;
    if (!open || !store || !grid) return;
    const inView = new Set<number>();
    const running = new Set<number>();
    const failed = new Set<number>();
    let active = true;

    const pump = () => {
      if (!active) return;
      const waiting = [...inView]
        .filter((n) => !store.urls.has(n) && !running.has(n) && !failed.has(n))
        .sort((a, b) => Math.abs(a - currentPage) - Math.abs(b - currentPage));
      for (const pageNumber of waiting) {
        if (running.size >= PARALLEL) break;
        running.add(pageNumber);
        store
          .draw(pageNumber)
          .then((url) => {
            if (active) setUrls((current) => new Map(current).set(pageNumber, url));
          })
          .catch(() => failed.add(pageNumber))
          .finally(() => {
            running.delete(pageNumber);
            pump();
          });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.page);
          if (entry.isIntersecting) inView.add(pageNumber);
          else inView.delete(pageNumber);
        }
        pump();
      },
      { root: grid, rootMargin: '100% 0px' },
    );
    for (const cell of grid.querySelectorAll('[data-page]')) observer.observe(cell);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [open, store, totalPages, currentPage]);

  if (!open) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const go = (event: FormEvent) => {
    event.preventDefault();
    const value = Number.parseInt(target, 10);
    if (!Number.isFinite(value)) return;
    onSelect(Math.min(Math.max(value, 1), totalPages));
  };

  return (
    <div className="page-thumbs fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('reader.thumbs.close')}
        className="page-thumbs-backdrop absolute inset-0 cursor-default bg-black/45"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-thumbs-title"
        className="page-thumbs-panel relative flex max-h-[85dvh] w-full flex-col rounded-t-3xl border-t border-line bg-surface shadow-2xl md:h-full md:max-h-none md:w-[23rem] md:rounded-none md:border-t-0 md:border-l"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong md:hidden" aria-hidden />
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <h2 id="page-thumbs-title" className="font-display text-lg font-semibold text-ink">
            {t('reader.thumbs.title')}
          </h2>
          <form onSubmit={go} className="ml-auto flex items-center gap-1.5">
            <label htmlFor="page-thumbs-go" className="sr-only">
              {t('reader.thumbs.goTo')}
            </label>
            <input
              id="page-thumbs-go"
              type="number"
              inputMode="numeric"
              enterKeyHint="go"
              min={1}
              max={totalPages}
              value={target}
              placeholder={String(currentPage)}
              onChange={(event) => setTarget(event.target.value)}
              className="page-thumbs-input h-9 w-20 rounded-[0.625rem] border border-line-strong bg-bg px-3 text-center text-base tabular-nums text-ink outline-none focus:border-accent"
            />
            <span className="text-sm whitespace-nowrap tabular-nums text-muted">/ {totalPages}</span>
            <button
              type="submit"
              disabled={!target}
              className="h-9 rounded-[0.625rem] bg-accent px-3.5 text-sm font-semibold text-on-accent transition-opacity disabled:opacity-40"
            >
              {t('reader.thumbs.go')}
            </button>
          </form>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('reader.thumbs.close')}
            title={t('reader.thumbs.close')}
            className="icon-btn icon-btn-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          ref={gridRef}
          className="grid flex-1 grid-cols-3 content-start gap-x-3 gap-y-4 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-4 md:grid-cols-2"
        >
          {pages.map((pageNumber) => {
            const url = urls.get(pageNumber);
            const current = pageNumber === currentPage;
            return (
              <button
                key={pageNumber}
                type="button"
                data-page={pageNumber}
                aria-current={current ? 'page' : undefined}
                aria-label={t('reader.thumbs.page', { page: pageNumber })}
                onClick={() => onSelect(pageNumber)}
                className="page-thumb group flex flex-col items-center gap-1.5 rounded-lg outline-none"
              >
                <span
                  className={cn(
                    'page-thumb-sheet relative block w-full overflow-hidden rounded-md bg-[var(--reader-page)]',
                    !url && 'animate-pulse',
                  )}
                  style={{ aspectRatio: `1 / ${aspect}` }}
                >
                  {url ? <img src={url} alt="" draggable={false} className="block h-full w-full" /> : null}
                </span>
                <span
                  className={cn(
                    'rounded-md px-2 text-xs font-semibold tabular-nums',
                    current ? 'bg-accent text-on-accent' : 'text-muted',
                  )}
                >
                  {pageNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function trapFocus(event: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const focusable = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), input')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
