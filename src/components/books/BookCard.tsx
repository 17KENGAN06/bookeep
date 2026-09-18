import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
        className="group focus-ring flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--app-shadow)] transition duration-200 hover:border-accent/30 motion-safe:hover:-translate-y-0.5"
      >
        <div className="h-52 overflow-hidden bg-elevated sm:h-56">
          <BookCover book={book} labeled={false} className="transition duration-300 motion-safe:group-hover:scale-[1.03]" />
        </div>
        <div className="flex flex-1 items-start justify-between gap-3 p-3.5 sm:p-4">
          <div className="min-w-0">
            <h2 className="font-display text-base leading-snug font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{t(`languages.${book.language}`)}</p>
          </div>
          <LevelBadge level={book.level} />
        </div>
        {percent > 0 ? (
          <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
            <ProgressBar value={percent} label={t('books.progress')} />
          </div>
        ) : null}
      </Link>
      <div className="absolute top-2 right-2 z-10">
        <LibraryActions bookId={book.id} compact />
      </div>
    </article>
  );
}
