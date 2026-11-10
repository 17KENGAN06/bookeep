import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { DemoNotice } from '@/components/reader/DemoNotice';
import { PdfDocument } from '@/components/reader/PdfDocument';
import { ReaderPaperFilters } from '@/components/reader/ReaderPaperFilters';
import { ReaderToolbar } from '@/components/reader/ReaderToolbar';
import { SelectionExplainer } from '@/components/reader/SelectionExplainer';
import { Skeleton } from '@/components/common/Skeleton';
import { useBook } from '@/hooks/useBooks';
import { useBookAccess } from '@/hooks/useBookAccess';
import { useAuth } from '@/hooks/useAuth';
import { openFullPdf } from '@/services/pdfCache';
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
  const { progress, saveProgress: saveReadingProgress } = useReadingProgress(book?.id);
  const access = useBookAccess();
  const { user } = useAuth();
  // Subscribers read the full PDF (from the device cache when opened before);
  // everyone else reads the public demo.
  const [fullFile, setFullFile] = useState<{ path: string; url: string | null } | null>(null);
  const pdfPath = book?.pdf_path ?? null;
  const wantsFull = access.ready && access.hasFullAccess && Boolean(pdfPath);
  const wantsFullRef = useRef(wantsFull);
  useEffect(() => {
    wantsFullRef.current = wantsFull;
  }, [wantsFull]);
  // Runs alongside the subscription check, not after it. Without a subscription
  // storage refuses the link and the demo opens.
  const mayHaveFull = Boolean(pdfPath) && (Boolean(user) || access.hasFullAccess);
  useEffect(() => {
    if (!mayHaveFull || !pdfPath) return;
    let active = true;
    let opened: string | null = null;
    void openFullPdf(pdfPath)
      .then((url) => {
        if (url.startsWith('blob:')) opened = url;
        if (active) setFullFile({ path: pdfPath, url });
        else if (opened) URL.revokeObjectURL(opened);
      })
      .catch((error: unknown) => {
        if (wantsFullRef.current) console.warn('Full PDF is not available, showing the demo', error);
        if (active) setFullFile({ path: pdfPath, url: null });
      });
    return () => {
      active = false;
      if (opened) URL.revokeObjectURL(opened);
    };
  }, [mayHaveFull, pdfPath]);
  const fullUrl = fullFile?.path === pdfPath ? fullFile.url : undefined;
  const isDemo = access.ready && (!wantsFull || fullUrl === null);
  const accessPending = !access.ready || (wantsFull && fullUrl === undefined);
  const readerFile = isDemo ? (book?.demo_path ?? null) : (fullUrl ?? null);
  const isDemoRef = useRef(isDemo);
  isDemoRef.current = isDemo;
  // The demo has fewer pages than the book: its page numbers must not overwrite real progress.
  const saveProgress = useCallback(
    (next: { currentPage: number; totalPages: number }) => {
      if (!isDemoRef.current) saveReadingProgress(next);
    },
    [saveReadingProgress],
  );
  const { paper, setPaper } = usePdfPaper();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(progress?.totalPages ?? 0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [pageText, setPageText] = useState<{ page: number; text: string } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const title = book ? getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en') : t('reader.titleFallback');
  const inited = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const { run: persistProgress, flush: flushProgress } = useDebouncedCallback(saveProgress, 450);

  const goTo = useCallback(
    (next: number | ((current: number) => number)) => {
      if (totalPages <= 0) return;
      setPage((current) => {
        const currentPage = clamp(typeof next === 'function' ? next(current) : next, 1, totalPages);
        persistProgress({ currentPage, totalPages });
        return currentPage;
      });
    },
    [persistProgress, totalPages],
  );

  useEffect(() => {
    const flush = () => flushProgress();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [flushProgress]);

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
      if (inited.current) {
        setPage((current) => (current > numPages ? 1 : current));
        return;
      }
      inited.current = true;
      const saved = progressRef.current?.currentPage ?? 1;
      const currentPage = saved > numPages ? 1 : clamp(saved, 1, numPages);
      setPage(currentPage);
      saveProgress({ currentPage, totalPages: numPages });
    },
    [saveProgress],
  );

  if (status === 'loading' || (book && accessPending)) {
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

  if (!book.pdf_path && !book.demo_path) {
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

  if (!readerFile) {
    // No demo copy yet (an admin makes one in /admin).
    return (
      <div className="min-h-dvh bg-bg px-4 py-16">
        <DocumentTitle title={title} noindex />
        <EmptyState
          title={t('demo.notReady')}
          description={t('demo.notReadyHint')}
          action={
            <ButtonLink to="/subscribe">
              {t('subscribe.cta')}
              <ButtonArrow />
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const percent = totalPages > 0 ? (page / totalPages) * 100 : 0;

  return (
    <div className="reader-shell flex min-h-dvh flex-col" data-paper={paper}>
      <DocumentTitle title={title} noindex />
      <ReaderPaperFilters />
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
        paper={paper}
        onPaperChange={setPaper}
      />
      <div
        className="h-[2px] bg-line/70"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalPages || 1}
        aria-valuenow={page}
        aria-label={t('reader.page', { current: page, total: totalPages || '—' })}
      >
        <div className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
      {isDemo ? (
        <DemoNotice
          demoPages={totalPages || book.demo_pages}
          fullPages={book.page_count}
          isGuest={access.isGuest}
          atEnd={totalPages > 0 && page >= totalPages}
        />
      ) : null}
      <main className="flex flex-1 flex-col">
        <PdfDocument
          key={`${book.id}-${isDemo ? 'demo' : 'full'}`}
          file={readerFile}
          page={page}
          zoom={zoom}
          onLoad={onPdfLoad}
          onPrev={() => goTo((current) => current - 1)}
          onNext={() => goTo((current) => current + 1)}
          onPageText={(text) => setPageText({ page, text })}
          stageRef={stageRef}
        />
        <SelectionExplainer
          stageRef={stageRef}
          pageText={pageText?.page === page ? pageText.text : ''}
          resetKey={`${page}-${zoom}`}
          book={{ language: book.language, level: book.level, title: book.title_original }}
          canTranslate={access.hasFullAccess}
        />
      </main>
    </div>
  );
}
