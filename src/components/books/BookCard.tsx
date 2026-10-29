import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdaptationBadge } from '@/components/books/AdaptationBadge';
import { BookCover } from '@/components/books/BookCover';
import { LevelBadge } from '@/components/books/LevelBadge';
import { LibraryActions } from '@/components/books/LibraryActions';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useAllReadingProgress } from '@/hooks/useReadingProgress';
import type { Book } from '@/types/book';
import { getLocalizedTitle } from '@/utils/bookCopy';

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  const { t, i18n } = useTranslation();
  const { map } = useAllReadingProgress();
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
  const progress = map[book.id];
  const percent = progress && progress.totalPages > 0 ? progress.percentage : 0;

  return (
    <article className="relative h-full">
      <Link
        to={`/books/${book.slug}`}
        className="group focus-ring lux-card flex h-full flex-col overflow-hidden rounded-[1.25rem] transition duration-500 ease-[var(--ease-lux)] motion-safe:hover:-translate-y-1 hover:shadow-[var(--app-shadow-lg)] sm:rounded-[1.5rem]"
      >
        <div className="book-stage relative flex aspect-[4/5] items-center justify-center overflow-hidden px-[18%] pt-[12%] pb-[14%]">
          <div className="book-object aspect-[2/3] h-full max-w-full transition duration-500 ease-[var(--ease-lux)] motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:scale-[1.02]">
            <BookCover book={book} labeled variant="card" compact />
          </div>
          <LevelBadge level={book.level} className="absolute top-3 left-3 z-[5] bg-surface/70 backdrop-blur-md sm:top-4 sm:left-4" />
          {!book.complete ? (
            <div className="absolute bottom-2.5 left-2.5 z-[5]">
              <AdaptationBadge complete={book.complete} />
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-5">
          <div className="min-w-0">
            <h2 className="font-display text-[0.9375rem] leading-snug font-medium tracking-tight break-words hyphens-auto text-ink sm:text-lg">
              {title}
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-[0.8125rem]">{t(`languages.${book.language}`)}</p>
          </div>
          {percent > 0 ? <ProgressBar value={percent} label={t('books.progress')} className="mt-auto" /> : null}
        </div>
      </Link>
      <div className="absolute top-2 right-2 z-10 sm:top-3 sm:right-3">
        <LibraryActions bookId={book.id} compact />
      </div>
    </article>
  );
}
