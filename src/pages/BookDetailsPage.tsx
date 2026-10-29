import { useState } from 'react';
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
import { useBook } from '@/hooks/useBooks';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { getLocalizedDescription, getLocalizedTitle } from '@/utils/bookCopy';

export function BookDetailsPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { book, status, reload } = useBook(slug);
  const { progress } = useReadingProgress(book?.id);
  const [downloading, setDownloading] = useState(false);

  if (status === 'loading') {
    return (
      <Container className="py-10 sm:py-14">
        <DocumentTitle title={t('book.loading')} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:gap-14">
          <Skeleton className="aspect-[4/5] w-full max-w-md rounded-[2rem]" />
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

  return (
    <Container className="py-10 sm:py-14">
      <DocumentTitle title={title} description={description} image={book.cover_path} />
      <Link to="/books" className="btn btn-quiet -ml-1 text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="btn-label">{t('book.backToCatalog')}</span>
      </Link>

      <div className="mt-6 grid items-start gap-8 sm:mt-8 md:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] lg:gap-16">
        <Reveal direction="left">
          <div className="lux-panel book-stage relative mx-auto flex w-full max-w-sm items-center justify-center rounded-[2rem] px-[16%] py-[13%] md:max-w-none">
            <div aria-hidden className="absolute inset-3 rounded-[1.5rem] border border-gold/15" />
            <div className="book-object aspect-[2/3] w-full">
              <BookCover book={book} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} direction="right">
          <div>
          <div className="flex flex-wrap items-center gap-3">
            <LevelBadge level={book.level} />
            <span className="text-[11px] font-bold tracking-[0.22em] text-muted uppercase">{t(`languages.${book.language}`)}</span>
          </div>

          <h1 className="display-title mt-5 break-words">
            {title}
          </h1>

          {book.title_original !== title ? (
            <p className="mt-3 font-display text-lg text-muted italic">{book.title_original}</p>
          ) : null}

          <div className="mt-6 max-w-2xl">
            <AdaptationBadge complete={book.complete} variant="banner" />
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-[1.0625rem]">{description}</p>

            {hasProgress && progress ? (
              <div className="mt-6 max-w-md">
                <ProgressBar value={progress.percentage} label={t('books.progress')} />
                <p className="mt-2 text-sm text-muted">
                  {t('book.continueFrom', { page: progress.currentPage })}
                </p>
              </div>
            ) : null}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ButtonLink to={`/read/${book.slug}`} className="w-full sm:w-auto">
              {hasProgress ? t('book.continueReading') : t('book.startReading')}
              <ButtonArrow />
            </ButtonLink>
            {pdfPath ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                isLoading={downloading}
                loadingText={t('book.downloading')}
                onClick={() => void downloadPdf()}
              >
                <Download className="h-4 w-4 text-gold" aria-hidden />
                {t('book.download')}
              </Button>
            ) : null}
          </div>
          <div className="mt-3 sm:mt-4">
            <LibraryActions bookId={book.id} />
          </div>
          </div>
        </Reveal>
      </div>
    </Container>
  );
}
