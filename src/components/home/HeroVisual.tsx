import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookCover } from '@/components/books/BookCover';
import { useBooks } from '@/hooks/useBooks';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

const poses = [
  'left-[2%] top-[22%] z-20 w-[56%] -rotate-[9deg]',
  'left-[22%] top-[6%] z-[25] w-[58%] rotate-[3deg]',
  'right-[0%] top-[18%] z-10 w-[54%] rotate-[11deg]',
] as const;

export function HeroVisual() {
  const { i18n } = useTranslation();
  const { books } = useBooks();
  const pile = books.slice(0, 3);

  if (pile.length === 0) {
    return <div className="mx-auto hidden h-[22rem] w-full max-w-lg lg:block" />;
  }

  return (
    <div className="relative mx-auto h-[18rem] w-full max-w-md sm:h-[22rem] lg:h-[26rem] lg:max-w-lg">
      <div
        aria-hidden
        className="absolute inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_40%_30%,var(--app-accent-soft),transparent_62%)]"
      />

      {pile.map((book, index) => {
        const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
        return (
          <Link
            key={book.id}
            to={`/books/${book.slug}`}
            aria-label={title}
            className={cn(
              'focus-ring absolute overflow-hidden rounded-2xl border border-line shadow-[var(--app-shadow)] transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:rotate-0',
              poses[index] ?? poses[0],
            )}
          >
            <div className="aspect-[3/4]">
              <BookCover book={book} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
