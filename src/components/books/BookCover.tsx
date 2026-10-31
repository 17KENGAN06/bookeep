import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getResizedImageUrl } from '@/services/supabase';
import type { Book } from '@/types/book';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

// Covers are 1024x1536. Cards never show them wider than ~240 CSS px, so 480 covers 2x screens.
const COVER_WIDTH = { full: 800, card: 480 } as const;

// Placeholder bindings for books that have no cover image yet.
const palettes = [
  ['#1d4a3e', '#0c231d', '#bfeedb'],
  ['#2f2a44', '#16131f', '#d9e4f2'],
  ['#5a3027', '#25120e', '#f1dccd'],
  ['#1f3446', '#0d1822', '#cfe6f0'],
  ['#3a3f2c', '#181a12', '#e6ead2'],
] as const;

function paletteFor(slug: string) {
  const total = slug.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length] ?? palettes[0];
}

function coverSources(book: Book, variant: 'full' | 'card') {
  // Portrait cover first; the landscape thumbnail is only a fallback and is then shown whole.
  const list = [book.cover_path, book.thumbnail_path];
  const originals = list.filter((value, index): value is string => Boolean(value) && list.indexOf(value) === index);
  // Originals stay as the fallback in case the image service refuses a file.
  return originals.flatMap((url) => {
    const resized = getResizedImageUrl(url, COVER_WIDTH[variant]);
    return resized ? [resized, url] : [url];
  });
}


type BookCoverProps = {
  book: Book;
  className?: string;
  labeled?: boolean;
  variant?: 'full' | 'card';
  compact?: boolean;
  /** Above-the-fold cover: load at once with high priority. */
  priority?: boolean;
};

export function BookCover({ book, className, labeled = true, variant = 'full', compact = false, priority = false }: BookCoverProps) {
  const { i18n } = useTranslation();
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
  const palette = paletteFor(book.slug);
  const sources = coverSources(book, variant);

  if (sources.length > 0) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden bg-elevated', className)}>
        <CoverImage key={sources.join('|')} sources={sources} lazy={variant === 'card' && !priority} priority={priority} />
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
      <span aria-hidden className={cn('relative font-sans text-[0.55rem] font-bold tracking-[0.24em] uppercase opacity-70', compact && 'hidden sm:block')}>
        Bookeep · {book.level}
      </span>
    </div>
  );
}

function CoverImage({ sources, lazy, priority }: { sources: string[]; lazy: boolean; priority: boolean }) {
  const [index, setIndex] = useState(0);
  const [landscape, setLandscape] = useState(false);
  const src = sources[index];

  if (!src) return null;

  const image = (
    <img
      src={src}
      alt=""
      decoding="async"
      loading={lazy ? 'lazy' : 'eager'}
      fetchPriority={priority ? 'high' : undefined}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        setLandscape(naturalWidth > naturalHeight * 1.05);
      }}
      onError={() => setIndex((current) => current + 1)}
      className={cn('relative h-full w-full', landscape ? 'object-contain' : 'object-cover object-center')}
    />
  );

  // A landscape image in a portrait frame is shown whole on a blurred copy of itself, never cropped.
  if (landscape) {
    return (
      <>
        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
        {image}
      </>
    );
  }

  return image;
}
