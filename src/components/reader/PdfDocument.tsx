import { Suspense, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { preload } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import pdfWorker from '@/pdf.worker-entry?worker&url';
import { useTextLayerSelection } from '@/hooks/useTextLayerSelection';
import { pageTextFromContent } from '@/utils/selectionContext';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// Warms the browser cache before a document opens: the worker is the reader's slowest step.
void fetch(pdfWorker).catch(() => {});

// Range stays off: Supabase Storage sends no Access-Control-Expose-Headers, so pdf.js
// cannot see Accept-Ranges cross-origin and would read the whole file anyway.
const pdfOptions = {
  disableRange: true,
  disableStream: true,
  isOffscreenCanvasSupported: false,
};

type PdfDocumentProps = {
  file: string;
  page: number;
  zoom: number;
  onLoad: (totalPages: number) => void;
  /** Unused: pages turn only with the reader's buttons, a swipe over the text never turns one. */
  onPrev?: () => void;
  onNext?: () => void;
  /** The text of the page on screen, once pdf.js has read it. */
  onPageText?: (text: string) => void;
  stageRef?: RefObject<HTMLDivElement | null>;
};

function LoadingPage() {
  return <Skeleton className="aspect-[3/4] w-full max-w-2xl rounded-lg" />;
}

export function PdfDocument({ file, page, zoom, onLoad, onPageText, stageRef: outerStageRef }: PdfDocumentProps) {
  const { t } = useTranslation();
  const innerStageRef = useRef<HTMLDivElement>(null);
  const stageRef = outerStageRef ?? innerStageRef;
  useTextLayerSelection(stageRef);
  const [width, setWidth] = useState(640);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [failed, setFailed] = useState(false);
  const [numPages, setNumPages] = useState(0);
  // Pages whose canvas is drawn, with the size it was drawn at.
  const [drawn, setDrawn] = useState<ReadonlyMap<number, string>>(() => new Map());
  const sizeKey = `${width}:${zoom}:${pixelRatio}`;
  const isDrawn = (pageNumber: number) => drawn.get(pageNumber) === sizeKey;
  // The last page on screen. It stays there while the next one is drawn.
  const [shownPage, setShownPage] = useState<number | null>(null);
  if (isDrawn(page) && shownPage !== page) setShownPage(page);
  const visiblePage = isDrawn(page) || shownPage == null ? page : shownPage;
  // Once the page on screen is drawn, the next page and then the previous one are drawn
  // hidden, so turning to them only reveals them. At most three pages are kept.
  const neighbours: number[] = [];
  if (isDrawn(page)) {
    if (page + 1 <= numPages) neighbours.push(page + 1);
    if (page - 1 >= 1 && (page + 1 > numPages || isDrawn(page + 1))) neighbours.push(page - 1);
  }
  const pages = [...new Set([visiblePage, page, ...neighbours])].slice(0, 3);
  // A page that left keeps no canvas: drop it, or it would show blank when it comes back.
  if ([...drawn.keys()].some((pageNumber) => !pages.includes(pageNumber))) {
    setDrawn(new Map([...drawn].filter(([pageNumber]) => pages.includes(pageNumber))));
  }

  // pdf.js requests the file only after its worker has started; this runs both at once.
  // A blob: URL is already in memory.
  if (file && !file.startsWith('blob:')) preload(file, { as: 'fetch', crossOrigin: 'anonymous' });

  // Hidden pages are out of reach: no focus, no selection, nothing for screen readers.
  useLayoutEffect(() => {
    for (const node of stageRef.current?.querySelectorAll<HTMLElement>('.reader-page') ?? []) {
      const hidden = node.classList.contains('reader-page-incoming');
      node.inert = hidden;
      if (hidden) node.setAttribute('aria-hidden', 'true');
      else node.removeAttribute('aria-hidden');
    }
  });

  useEffect(() => {
    setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => {
      setWidth(Math.max(260, Math.min(node.clientWidth - (node.clientWidth < 640 ? 16 : 48), 860)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [stageRef]);

  useEffect(() => {
    setFailed(false);
  }, [file, reloadKey]);

  const retry = () => {
    setFailed(false);
    setReloadKey((value) => value + 1);
  };

  const errorState = (
    <ErrorState
      title={t('reader.error')}
      description={t('reader.errorHint')}
      onRetry={retry}
    />
  );

  return (
    <div
      id="reader-stage"
      ref={stageRef}
      tabIndex={-1}
      // The book's hidden text layer must stay as it is: a page translated by the browser
      // would break selection and send the translated words to "Explain".
      translate="no"
      className="notranslate reader-stage flex flex-1 justify-center overflow-x-auto px-2 pt-4 pb-28 outline-none sm:px-6 sm:pt-10 md:pb-12"
    >
      {!file || failed ? (
        errorState
      ) : (
        <ErrorBoundary resetKey={`${file}-${reloadKey}`} fallback={errorState}>
          <Suspense fallback={<LoadingPage />}>
            <Document
              key={`${file}-${reloadKey}`}
              file={file}
              options={pdfOptions}
              suspense={false}
              loading={<LoadingPage />}
              error={errorState}
              onLoadError={(error) => {
                console.error(error);
                setFailed(true);
              }}
              onLoadSuccess={({ numPages: total }) => {
                setNumPages(total);
                onLoad(total);
              }}
            >
              {pages.map((pageNumber) => {
                const hidden = pageNumber !== visiblePage;
                const markDrawn = () => {
                  setDrawn((current) => new Map(current).set(pageNumber, sizeKey));
                };
                return (
                  <Page
                    key={pageNumber}
                    pageNumber={pageNumber}
                    width={width * zoom}
                    devicePixelRatio={pixelRatio}
                    className={hidden ? 'reader-page reader-page-incoming' : 'reader-page'}
                    renderAnnotationLayer={false}
                    // A drawn-ahead page gets its text layer when it comes on screen, so the
                    // selection code only ever finds the text of the page being read.
                    renderTextLayer={pageNumber === page || pageNumber === visiblePage}
                    suspense={false}
                    loading={hidden ? null : <LoadingPage />}
                    onRenderSuccess={markDrawn}
                    onRenderError={markDrawn}
                    onGetTextSuccess={(content) => {
                      if (pageNumber === page) onPageText?.(pageTextFromContent(content));
                    }}
                  />
                );
              })}
            </Document>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
