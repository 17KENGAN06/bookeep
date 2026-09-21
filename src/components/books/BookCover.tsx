import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book } from '@/types/book';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

const palettes = [
  ['#1f3d32', '#2e7d66', '#cde3d8'],
  ['#122e26', '#3cd6a0', '#a7f3d0'],
  ['#17382e', '#256653', '#e6f0eb'],
  ['#0d2720', '#2e7d66', '#a7cbbb'],
] as const;

function paletteFor(slug: string) {
  const total = slug.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length] ?? palettes[0];
}

type BookCoverProps = {
  book: Book;
  className?: string;
  labeled?: boolean;
  variant?: 'full' | 'card';
};

export function BookCover({ book, className, labeled = true, variant = 'full' }: BookCoverProps) {
  const { i18n } = useTranslation();
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
  const palette = paletteFor(book.slug);
  const preferred = variant === 'card' ? book.thumbnail_path || book.cover_path : book.cover_path;
  const fallbackSrc = variant === 'card' && book.thumbnail_path ? book.cover_path : null;
  const [src, setSrc] = useState<string | null>(preferred);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrc(preferred);
    setFailed(false);
    setLoaded(false);
  }, [preferred]);

  if (src && !failed) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden bg-elevated', className)}>
        {loaded ? null : <div className="absolute inset-0 animate-pulse bg-surface-2" />}
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (fallbackSrc && src !== fallbackSrc) {
              setSrc(fallbackSrc);
              setLoaded(false);
              return;
            }
            setFailed(true);
          }}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            variant === 'card' ? 'object-center' : 'object-top',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative isolate flex h-full w-full flex-col justify-end overflow-hidden p-4', className)}
      style={{
        background: `linear-gradient(165deg, ${palette[0]} 0%, ${palette[1]} 62%, ${palette[2]} 140%)`,
      }}
    >
      <div aria-hidden className="absolute inset-x-6 top-6 h-px bg-white/20" />
      {labeled ? (
        <p className="relative line-clamp-3 font-display text-lg leading-tight font-semibold text-white sm:text-xl">
          {title}
        </p>
      ) : null}
    </div>
  );
}
