import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/common/Button';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { PdfDocument } from '@/components/reader/PdfDocument';
import { ReaderToolbar } from '@/components/reader/ReaderToolbar';
import { Skeleton } from '@/components/common/Skeleton';
import { useBook } from '@/hooks/useBooks';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { usePdfPaper } from '@/hooks/usePdfPaper';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { clamp } from '@/utils/cn';

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.7;
const ZOOM_STEP = 0.1;

export function ReaderPage() {
  const { slug } = useParams();
  return <ReaderPageInner key={slug} />;
}

function ReaderPageInner() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { book, status } = useBook(slug);
  const { progress, saveProgress } = useReadingProgress(book?.id);
  const { isDarkPaper, togglePaper } = usePdfPaper();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(progress?.totalPages ?? 0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const title = book ? getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en') : t('reader.titleFallback');
  const inited = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const persist = useDebouncedCallback(saveProgress, 400);

  const goTo = useCallback(
    (next: number | ((current: number) => number)) => {
      if (totalPages <= 0) return;
      setPage((current) => {
        const currentPage = clamp(typeof next === 'function' ? next(current) : next, 1, totalPages);
        persist({ currentPage, totalPages });
        return currentPage;
      });
    },
    [persist, totalPages],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === 'ArrowLeft') goTo((current) => current - 1);
      if (event.key === 'ArrowRight') goTo((current) => current + 1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const onPdfLoad = useCallback(
    (numPages: number) => {
      if (numPages <= 0) return;
      setTotalPages(numPages);
      if (inited.current) return;
      inited.current = true;
      const saved = progressRef.current?.currentPage ?? 1;
      const currentPage = saved > numPages ? 1 : clamp(saved, 1, numPages);
      setPage(currentPage);
      saveProgress({ currentPage, totalPages: numPages });
    },
    [saveProgress],
  );

  if (status === 'loading') {
    return (
      <div className="min-h-dvh bg-bg p-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="mx-auto mt-8 h-[70vh] max-w-3xl rounded-3xl" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-dvh bg-bg px-4 py-16">
        <DocumentTitle title={t('book.notFound')} noindex />
        <EmptyState
          title={t('book.notFound')}
          description={t('book.notFoundHint')}
          action={<ButtonLink to="/books" variant="secondary">{t('book.backToCatalog')}</ButtonLink>}
        />
      </div>
    );
  }

  if (!book.pdf_path) {
    return (
      <div className="min-h-dvh bg-bg px-4 py-16">
        <DocumentTitle title={title} noindex />
        <EmptyState
          title={t('reader.missing')}
          description={t('reader.missingHint')}
          action={<ButtonLink to={`/books/${book.slug}`} variant="secondary">{t('reader.back')}</ButtonLink>}
        />
      </div>
    );
  }

  const percent = totalPages > 0 ? (page / totalPages) * 100 : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <DocumentTitle title={title} noindex />
      <a href="#reader-stage" className="skip-link">
        {t('reader.skipToPage')}
      </a>
      <ReaderToolbar
        title={title}
        backTo={`/books/${book.slug}`}
        currentPage={page}
        totalPages={totalPages}
        canPrev={page > 1}
        canNext={page < totalPages}
        onPrev={() => goTo((current) => current - 1)}
        onNext={() => goTo((current) => current + 1)}
        onZoomOut={() => setZoom((value) => clamp(Number((value - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
        onZoomIn={() => setZoom((value) => clamp(Number((value + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
        isFullscreen={fullscreen}
        onToggleFullscreen={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen();
        }}
        isDarkPaper={isDarkPaper}
        onTogglePaper={togglePaper}
      />
      <div
        className="h-0.5 bg-elevated"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalPages || 1}
        aria-valuenow={page}
        aria-label={t('reader.page', { current: page, total: totalPages || '—' })}
      >
        <div className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
      </div>
      <main className="flex flex-1 flex-col">
        <PdfDocument
          key={book.id}
          file={book.pdf_path}
          page={page}
          zoom={zoom}
          nightPaper={isDarkPaper}
          onLoad={onPdfLoad}
          onPrev={() => goTo((current) => current - 1)}
          onNext={() => goTo((current) => current + 1)}
        />
      </main>
    </div>
  );
}
