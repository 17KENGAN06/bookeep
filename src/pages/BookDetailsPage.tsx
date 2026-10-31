import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdaptationBadge } from '@/components/books/AdaptationBadge';
import { BookCover } from '@/components/books/BookCover';
import { LevelBadge } from '@/components/books/LevelBadge';
import { LibraryActions } from '@/components/books/LibraryActions';
import { Button, ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Reveal } from '@/components/common/Reveal';
import { Skeleton } from '@/components/common/Skeleton';
import { CoverScene, Scene } from '@/components/scene/Scene';
import { useBook } from '@/hooks/useBooks';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { loadReaderPage } from '@/routes/lazyPage';
import { getLocalizedDescription, getLocalizedTitle } from '@/utils/bookCopy';
import { coverUrl } from '@/utils/cover';

export function BookDetailsPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { book, status, reload } = useBook(slug);
  const { progress } = useReadingProgress(book?.id);
  const [downloading, setDownloading] = useState(false);

  // Most visitors here go on to read, so the reader and its PDF worker are fetched ahead.
  useEffect(() => {
    void loadReaderPage().catch(() => {});
  }, []);

  if (status === 'loading') {
    return (
      <Container className="py-10 sm:py-14">
        <DocumentTitle title={t('book.loading')} />
        <div className="grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-20">
          <Skeleton className="mx-auto aspect-[4/5] w-full max-w-[26rem] rounded-[2rem] md:max-w-none" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </Container>
    );
  }

  if (status === 'error' && !book) {
    return (
      <Container className="py-16">
        <DocumentTitle title={t('book.notFound')} description={t('book.notFoundHint')} noindex />
        <EmptyState
          title={t('book.notFound')}
          description={t('book.notFoundHint')}
          action={<ButtonLink to="/books" variant="secondary">{t('book.backToCatalog')}</ButtonLink>}
        />
      </Container>
    );
  }

  if (!book) {
    return (
      <Container className="py-16">
        <ErrorState onRetry={() => void reload()} />
      </Container>
    );
  }

  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
  const description = getLocalizedDescription(book, i18n.resolvedLanguage ?? 'en');
  const hasProgress = Boolean(progress && progress.currentPage > 1);
  const pdfPath = book.pdf_path;
  const pdfFileName = `${book.slug}.pdf`;

  async function downloadPdf() {
    if (!pdfPath) return;
    setDownloading(true);
    try {
      const response = await fetch(pdfPath);
      if (!response.ok) throw new Error('download');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(pdfPath, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }

  const backdrop = coverUrl(book, 480);
  const facts = [
    { label: t('book.factLevel'), value: book.level },
    { label: t('book.factLanguage'), value: t(`languages.${book.language}`) },
    ...(book.page_count ? [{ label: t('book.factPages'), value: String(book.page_count) }] : []),
  ];

  return (
    <section className="relative isolate">
      <DocumentTitle title={title} description={description} image={book.cover_path} />
      {backdrop ? <CoverScene src={backdrop} underHeader /> : <Scene name="library" underHeader shade="soft" />}
      <Container className="relative py-8 sm:py-12 lg:py-16">
        <Link to="/books" className="btn btn-quiet -ml-1 text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="btn-label">{t('book.backToCatalog')}</span>
        </Link>

        <div className="mt-6 grid items-center gap-10 sm:mt-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal direction="left">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[26rem] md:max-w-none">
              <div aria-hidden className="absolute inset-x-[4%] top-0 bottom-[12%] rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(160deg,rgba(220,255,240,0.06),rgba(220,255,240,0.01)_50%,rgba(0,0,0,0.15))] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:rounded-[2.5rem]" />
              <div aria-hidden className="pointer-events-none absolute top-[-6%] left-1/2 h-[60%] w-[80%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(235,250,240,0.12),transparent)]" />
              <div aria-hidden className="absolute right-[-8%] bottom-0 left-[-8%] h-[13%] [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
                <div className="stone-ledge inset-0" />
                <div className="ledge-front absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-black/50 to-black/85" />
                <div className="absolute inset-x-0 -bottom-px h-[35%] bg-gradient-to-b from-transparent to-bg" />
              </div>
              <div className="absolute bottom-[12.2%] left-1/2 w-[58%] -translate-x-1/2">
                <div className="book-object aspect-[2/3] w-full">
                  <BookCover book={book} priority />
                </div>
                <span aria-hidden className="book-contact" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} direction="right">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <LevelBadge level={book.level} />
                {book.complete ? null : <span className="pill pill-accent">{t('book.adaptationInProgress')}</span>}
              </div>

              <h1 className="display-title mt-6 break-words">{title}</h1>

              {book.title_original !== title ? (
                <p className="mt-3 font-display text-xl text-muted italic">{book.title_original}</p>
              ) : null}

              <p className="lead mt-6 max-w-2xl">{description}</p>

              <dl className="mt-8 flex max-w-xl flex-wrap gap-x-8 gap-y-1 border-y border-line py-1 sm:gap-x-10">
                {facts.map((fact) => (
                  <div key={fact.label} className="min-w-0 py-3">
                    <dt className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase sm:text-[11px] sm:tracking-[0.2em]">{fact.label}</dt>
                    <dd className="mt-1.5 font-display text-[15px] font-medium break-words text-ink sm:text-xl">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 max-w-2xl">
                <AdaptationBadge complete={book.complete} variant="banner" />
              </div>

              {hasProgress && progress ? (
                <div className="mt-6 max-w-md">
                  <ProgressBar value={progress.percentage} label={t('books.progress')} />
                  <p className="mt-2 text-sm text-muted">{t('book.continueFrom', { page: progress.currentPage })}</p>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ButtonLink to={`/read/${book.slug}`} className="w-full !min-h-14 !px-7 sm:w-auto">
                  {hasProgress ? t('books.continueReading') : t('books.startReading')}
                  <ButtonArrow />
                </ButtonLink>
                {pdfPath ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full !min-h-14 sm:w-auto"
                    isLoading={downloading}
                    loadingText={t('book.downloading')}
                    onClick={() => void downloadPdf()}
                  >
                    <Download className="h-4 w-4 text-accent" aria-hidden />
                    {t('book.download')}
                  </Button>
                ) : null}
              </div>
              <div className="mt-3">
                <LibraryActions bookId={book.id} />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
