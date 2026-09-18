import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookCover } from '@/components/books/BookCover';
import { useBooks } from '@/hooks/useBooks';
import { pickHeroBooks } from '@/services/books';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

const pilePoses = {
  1: ['left-1/2 top-[8%] z-20 w-[56%] -translate-x-1/2 rotate-[2deg] sm:w-[50%]'],
  2: [
    'left-[6%] top-[18%] z-20 w-[48%] -rotate-[7deg] sm:left-[10%] sm:w-[46%]',
    'right-[6%] top-[12%] z-[25] w-[48%] rotate-[6deg] sm:right-[10%] sm:w-[46%]',
  ],
  3: [
    'left-[1%] top-[30%] z-20 w-[44%] -rotate-[9deg] sm:left-[4%] sm:top-[24%] sm:w-[48%]',
    'left-[27%] top-[8%] z-[28] w-[46%] rotate-[1.5deg] sm:left-[26%] sm:top-[5%] sm:w-[50%]',
    'right-[1%] top-[28%] z-10 w-[44%] rotate-[10deg] sm:right-[3%] sm:top-[20%] sm:w-[48%]',
  ],
} as const;

export function HeroVisual() {
  const { t, i18n } = useTranslation();
  const { books } = useBooks();
  const pile = pickHeroBooks(books);

  if (pile.length === 0) {
    return <div className="mx-auto hidden h-[26rem] w-full max-w-lg xl:block" />;
  }

  const poses = pilePoses[Math.min(pile.length, 3) as 1 | 2 | 3];

  return (
    <div className="relative isolate mx-auto h-[28rem] w-full max-w-md sm:h-[30rem] lg:h-[34rem] lg:max-w-lg">
      <div className="absolute inset-0 rounded-[2rem] border border-line bg-surface/55 shadow-[var(--app-shadow)] backdrop-blur-sm" />
      <div
        aria-hidden
        className="absolute inset-x-8 top-6 h-[58%] rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_20%,var(--app-accent-soft),transparent_68%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-[12%] bottom-[18%] h-10 rounded-full bg-accent/15 blur-2xl"
      />

      {pile.map((book, index) => {
        const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
        return (
          <Link
            key={book.id}
            to={`/books/${book.slug}`}
            aria-label={title}
            className={cn(
              'group focus-ring absolute overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_40px_-24px_rgba(31,61,50,0.55)] transition duration-300',
              'motion-safe:hover:-translate-y-1.5 motion-safe:hover:rotate-0',
              poses[index] ?? poses[0],
            )}
          >
            <div className="aspect-[2/3]">
              <BookCover book={book} />
            </div>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/80 to-transparent px-2.5 pt-8 pb-2.5">
              <span className="font-display line-clamp-2 text-[11px] leading-tight font-semibold text-ink sm:text-xs">
                {title}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {t(`languages.${book.language}`)} · {book.level}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
