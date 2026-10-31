import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdaptationBadge } from '@/components/books/AdaptationBadge';
import { BookCover } from '@/components/books/BookCover';
import { LevelBadge } from '@/components/books/LevelBadge';
import { LibraryActions } from '@/components/books/LibraryActions';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useAllReadingProgress } from '@/hooks/useReadingProgress';
import type { Book } from '@/types/book';
import { getLocalizedDescription, getLocalizedTitle } from '@/utils/bookCopy';

type BookCardProps = {
  book: Book;
};

/** Horizontal catalog card: the cover as an object on the left, reading actions on the right. */
export function BookCard({ book }: BookCardProps) {
  const { t, i18n } = useTranslation();
  const { map } = useAllReadingProgress();
  const language = i18n.resolvedLanguage ?? 'en';
  const title = getLocalizedTitle(book, language);
  const description = getLocalizedDescription(book, language);
  const progress = map[book.id];
  const percent = progress && progress.totalPages > 0 ? progress.percentage : 0;
  const started = Boolean(progress && progress.currentPage > 1) || percent > 0;
  const detailsTo = `/books/${book.slug}`;

  return (
    <article className="group lux-card lift @container relative flex h-full flex-col rounded-[1.5rem] p-3.5 hover:border-transparent sm:rounded-[1.75rem] sm:p-4">
      <div className="flex flex-1 gap-4 @[25rem]:gap-5">
        <Link
          to={detailsTo}
          tabIndex={-1}
          aria-hidden
          className="relative w-[34%] max-w-[9.5rem] shrink-0 self-start @[25rem]:w-[38%] @[25rem]:max-w-[10.5rem]"
        >
          <div className="book-object aspect-[2/3] w-full transition duration-700 ease-[var(--ease-lux)] motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-[-1deg]">
            <BookCover book={book} labeled variant="card" compact />
          </div>
          <LevelBadge level={book.level} className="absolute -top-1.5 -left-1.5 z-[5]" />
          {!book.complete ? (
            <div className="absolute bottom-2 left-2 z-[5]">
              <AdaptationBadge complete={false} compact />
            </div>
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-2 @[22rem]:flex-row @[22rem]:items-start @[22rem]:justify-between">
            <div className="min-w-0 pt-1">
              <h3 className="font-display text-[1.0625rem] leading-snug font-medium tracking-tight break-words text-ink @[25rem]:text-[1.25rem]">
                <Link to={detailsTo} className="focus-ring rounded-sm transition hover:text-accent">
                  {title}
                </Link>
              </h3>
              <p className="mt-1 text-xs text-muted sm:text-[0.8125rem]">{t(`languages.${book.language}`)}</p>
            </div>
            <div className="-ml-1.5 shrink-0 @[22rem]:-mt-0.5 @[22rem]:-mr-0.5 @[22rem]:ml-0">
              <LibraryActions bookId={book.id} compact />
            </div>
          </div>

          <div className="mt-3 @[25rem]:mt-4">
            {started ? (
              <ProgressBar value={percent} label={t('books.progress')} />
            ) : (
              <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-muted @[25rem]:line-clamp-3">{description}</p>
            )}
          </div>

          <CardActions className="mt-auto hidden pt-4 @[25rem]:flex" detailsTo={detailsTo} readTo={`/read/${book.slug}`} started={started} />
        </div>
      </div>
      <CardActions className="mt-4 flex @[25rem]:hidden" detailsTo={detailsTo} readTo={`/read/${book.slug}`} started={started} />
    </article>
  );
}

function CardActions({ className, detailsTo, readTo, started }: { className: string; detailsTo: string; readTo: string; started: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`${className} flex-col gap-2`}>
      <Link to={readTo} className="btn btn-primary btn-sm w-full !min-h-11">
        {started ? t('books.continueReading') : t('books.startReading')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      <Link to={detailsTo} className="btn btn-secondary btn-sm w-full !min-h-11">
        <BookOpen className="h-4 w-4 text-accent" aria-hidden />
        {t('books.openBook')}
      </Link>
    </div>
  );
}
