import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const workerBase = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', `${window.location.origin}${workerBase}`).href;

const pdfOptions = {
  disableRange: true,
  disableStream: true,
  isEvalSupported: false,
  isOffscreenCanvasSupported: false,
};

type PdfDocumentProps = {
  file: string;
  page: number;
  zoom: number;
  nightPaper?: boolean;
  onLoad: (totalPages: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PdfDocument({ file, page, zoom, nightPaper = false, onLoad, onPrev, onNext }: PdfDocumentProps) {
  const { t } = useTranslation();
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [pixelRatio, setPixelRatio] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => {
      setWidth(Math.max(260, Math.min(node.clientWidth - 24, 860)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPdfData(null);
    setFetchError(false);

    void fetch(file, { mode: 'cors', credentials: 'omit', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('pdf-fetch');
        return response.arrayBuffer();
      })
      .then((buffer) => {
        setPdfData(buffer.slice(0));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setFetchError(true);
        console.error(error);
      });

    return () => controller.abort();
  }, [file, reloadKey]);

  const documentFile = useMemo(
    () => (pdfData ? { data: new Uint8Array(pdfData) } : null),
    [pdfData],
  );

  const retry = () => setReloadKey((value) => value + 1);
  const failed = (
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
      className="reader-stage flex flex-1 justify-center overflow-x-auto px-3 py-6 sm:px-6 sm:py-10"
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
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx > 0) onPrev();
        else onNext();
      }}
    >
      {fetchError || !file ? (
        failed
      ) : (
        <ErrorBoundary resetKey={`${file}-${reloadKey}-${page}`} fallback={failed}>
          {documentFile ? (
            <Document
              key={`${file}-${reloadKey}`}
              file={documentFile}
              options={pdfOptions}
              loading={<Skeleton className="h-64 w-full max-w-2xl rounded-3xl sm:h-80" />}
              error={failed}
              onLoadError={() => undefined}
              onLoadSuccess={({ numPages }) => onLoad(numPages)}
            >
              <Page
                pageNumber={page}
                width={width * zoom}
                devicePixelRatio={pixelRatio}
                className={nightPaper ? 'reader-page is-night' : 'reader-page'}
                renderAnnotationLayer={false}
                loading={<Skeleton className="h-64 w-full max-w-2xl rounded-3xl sm:h-80" />}
              />
            </Document>
          ) : (
            <Skeleton className="h-64 w-full max-w-2xl rounded-3xl sm:h-80" />
          )}
        </ErrorBoundary>
      )}
    </div>
  );
}
