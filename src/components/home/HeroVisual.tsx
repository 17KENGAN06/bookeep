import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookCover } from '@/components/books/BookCover';
import { useBooks } from '@/hooks/useBooks';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

const pilePoses = {
  1: ['left-1/2 top-[6%] z-20 w-[58%] -translate-x-1/2 rotate-[3deg] sm:w-[52%]'],
  2: [
    'left-[4%] top-[16%] z-20 w-[50%] -rotate-[8deg] sm:left-[8%] sm:w-[48%]',
    'right-[4%] top-[10%] z-[25] w-[50%] rotate-[7deg] sm:right-[8%] sm:w-[48%]',
  ],
  3: [
    'left-[0%] top-[28%] z-20 w-[46%] -rotate-[8deg] sm:left-[2%] sm:top-[22%] sm:w-[52%] sm:-rotate-[9deg]',
    'left-[27%] top-[8%] z-[25] w-[48%] rotate-[2deg] sm:left-[24%] sm:top-[6%] sm:w-[54%] sm:rotate-[3deg]',
    'right-[0%] top-[26%] z-10 w-[46%] rotate-[10deg] sm:right-[0%] sm:top-[18%] sm:w-[52%] sm:rotate-[11deg]',
  ],
} as const;

export function HeroVisual() {
  const { i18n } = useTranslation();
  const { books } = useBooks();
  const pile = books.slice(0, 3);

  if (pile.length === 0) {
    return <div className="mx-auto hidden h-[26rem] w-full max-w-lg xl:block" />;
  }

  const poses = pilePoses[Math.min(pile.length, 3) as 1 | 2 | 3];

  return (
    <div className="relative isolate mx-auto h-[26rem] w-full max-w-md sm:h-[28rem] lg:h-[32rem] lg:max-w-lg">
      <div
        aria-hidden
        className="absolute inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_40%_30%,var(--app-accent-soft),transparent_62%)]"
      />

      {pile.map((book, index) => {
        const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
        return (
          <Link
            key={book.id}
            to={`/books/${book.slug}`}
            aria-label={title}
            className={cn(
              'focus-ring absolute overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--app-shadow)] transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:rotate-0',
              poses[index] ?? poses[0],
            )}
          >
            <div className="aspect-[2/3]">
              <BookCover book={book} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
