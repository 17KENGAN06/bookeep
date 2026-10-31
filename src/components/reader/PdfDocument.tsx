import { Suspense, useEffect, useRef, useState, type RefObject } from 'react';
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
  onPrev: () => void;
  onNext: () => void;
  /** The text of the page on screen, once pdf.js has read it. */
  onPageText?: (text: string) => void;
  stageRef?: RefObject<HTMLDivElement | null>;
};

function hasTextSelection() {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim());
}

function LoadingPage() {
  return <Skeleton className="aspect-[3/4] w-full max-w-2xl rounded-lg" />;
}

export function PdfDocument({ file, page, zoom, onLoad, onPrev, onNext, onPageText, stageRef: outerStageRef }: PdfDocumentProps) {
  const { t } = useTranslation();
  const innerStageRef = useRef<HTMLDivElement>(null);
  const stageRef = outerStageRef ?? innerStageRef;
  useTextLayerSelection(stageRef);
  const [width, setWidth] = useState(640);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [failed, setFailed] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  // pdf.js requests the file only after its worker has started; this runs both at once.
  if (file) preload(file, { as: 'fetch', crossOrigin: 'anonymous' });

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
      className="reader-stage flex flex-1 justify-center overflow-x-auto px-2 pt-4 pb-28 outline-none sm:px-6 sm:pt-10 md:pb-12"
      onPointerDown={(event) => {
        swipeStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        if (swipeStart.current == null || zoom !== 1) {
          swipeStart.current = null;
          return;
        }
        const dx = event.clientX - swipeStart.current.x;
        const dy = event.clientY - swipeStart.current.y;
        swipeStart.current = null;
        // A drag that selected text is a selection, not a page turn.
        if (hasTextSelection()) return;
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx > 0) onPrev();
        else onNext();
      }}
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
              onLoadSuccess={({ numPages }) => onLoad(numPages)}
            >
              <Page
                pageNumber={page}
                width={width * zoom}
                devicePixelRatio={pixelRatio}
                className="reader-page"
                renderAnnotationLayer={false}
                suspense={false}
                loading={<LoadingPage />}
                onGetTextSuccess={(content) => onPageText?.(pageTextFromContent(content))}
              />
            </Document>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
