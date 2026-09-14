import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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
  const [reloadKey, setReloadKey] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const update = () => {
      setWidth(Math.max(280, Math.min(node.clientWidth - 24, 860)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
      <ErrorBoundary resetKey={`${file}-${reloadKey}-${page}`} fallback={failed}>
        <Document
          key={`${file}-${reloadKey}`}
          file={file}
          loading={<Skeleton className="h-64 w-full max-w-2xl rounded-3xl sm:h-80" />}
          error={failed}
          onLoadError={() => undefined}
          onLoadSuccess={({ numPages }) => onLoad(numPages)}
        >
          <Page
            pageNumber={page}
            width={width * zoom}
            className={nightPaper ? 'reader-page is-night' : 'reader-page'}
            renderAnnotationLayer={false}
            loading={<Skeleton className="h-64 w-full max-w-2xl rounded-3xl sm:h-80" />}
          />
        </Document>
      </ErrorBoundary>
    </div>
  );
}
