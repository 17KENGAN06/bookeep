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
    return <div className="mx-auto hidden h-[26rem] w-full max-w-lg md:block" />;
  }

  const poses = pilePoses[Math.min(pile.length, 3) as 1 | 2 | 3];

  return (
    <div className="relative isolate mx-auto h-[24rem] w-full max-w-md min-[420px]:h-[28rem] sm:h-[30rem] md:h-[26rem] lg:h-[32rem] lg:max-w-lg xl:h-[34rem]">
      <div className="lux-panel absolute inset-0 rounded-[2.25rem]" />
      <div aria-hidden className="absolute inset-3 rounded-[1.75rem] border border-gold/20 sm:inset-4" />
      <div
        aria-hidden
        className="absolute inset-x-[14%] bottom-[14%] h-12 rounded-full bg-black/30 blur-2xl dark:bg-black/60"
      />

      {pile.map((book, index) => {
        const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
        return (
          <Link
            key={book.id}
            to={`/books/${book.slug}`}
            aria-label={title}
            className={cn(
              'group focus-ring book-object absolute bg-surface transition duration-500 ease-[var(--ease-lux)]',
              'motion-safe:hover:-translate-y-2 motion-safe:hover:rotate-0',
              poses[index] ?? poses[0],
            )}
          >
            <div className="aspect-[2/3]">
              <BookCover book={book} labeled={false} />
            </div>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pt-10 pb-3 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="font-display line-clamp-2 text-xs leading-tight font-medium text-white sm:text-sm">
                {title}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-white/70 uppercase">
                {t(`languages.${book.language}`)} · {book.level}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
