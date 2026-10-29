import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book } from '@/types/book';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

const palettes = [
  ['#1f5848', '#0f3329', '#d8bd86'],
  ['#3b2a4a', '#22172c', '#d8bd86'],
  ['#7a3b2c', '#4a2017', '#ecd9b0'],
  ['#233a52', '#121f2e', '#d8bd86'],
  ['#5a4a2a', '#2f2614', '#efe2c4'],
] as const;

function paletteFor(slug: string) {
  const total = slug.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length] ?? palettes[0];
}

function coverSources(book: Book, variant: 'full' | 'card') {
  const list = variant === 'card' ? [book.thumbnail_path, book.cover_path] : [book.cover_path];
  return list.filter((value, index): value is string => Boolean(value) && list.indexOf(value) === index);
}

type BookCoverProps = {
  book: Book;
  className?: string;
  labeled?: boolean;
  variant?: 'full' | 'card';
  compact?: boolean;
};

export function BookCover({ book, className, labeled = true, variant = 'full', compact = false }: BookCoverProps) {
  const { i18n } = useTranslation();
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
  const palette = paletteFor(book.slug);
  const sources = coverSources(book, variant);

  if (sources.length > 0) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden bg-elevated', className)}>
        <CoverImage key={sources.join('|')} sources={sources} variant={variant} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative isolate flex h-full w-full flex-col justify-between overflow-hidden',
        compact ? 'p-[10%]' : 'p-[9%]',
        className,
      )}
      style={{
        background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
        color: palette[2],
      }}
    >
      <div aria-hidden className="absolute inset-[5%] rounded-[2px] border border-current opacity-25" />
      <span aria-hidden className="relative block h-px w-1/3 bg-current opacity-60" />
      {labeled ? (
        <p
          className={cn(
            'relative line-clamp-4 font-display leading-[1.12] font-medium',
            compact ? 'text-[clamp(0.7rem,2.6vw,1rem)]' : 'text-xl sm:text-2xl',
          )}
        >
          {title}
        </p>
      ) : null}
      <span aria-hidden className="relative font-sans text-[0.55rem] font-bold tracking-[0.24em] uppercase opacity-70">
        Bookeep · {book.level}
      </span>
    </div>
  );
}

function CoverImage({
  sources,
  variant,
}: {
  sources: string[];
  variant: 'full' | 'card';
}) {
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      decoding="async"
      onError={() => setIndex((current) => current + 1)}
      className={cn(
        'h-full w-full object-cover',
        variant === 'card' ? 'object-center' : 'object-top',
      )}
    />
  );
}
