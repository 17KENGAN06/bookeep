import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookCover } from '@/components/books/BookCover';
import { useBooks } from '@/hooks/useBooks';
import { pickHeroBooks } from '@/services/books';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

type Pose = { className: string; depth: number };

// Books stand on the shelf (its top edge sits 12% above the bottom of the stage).
// Books further back stand a little higher and smaller, which reads as depth.
const poses: Record<1 | 2 | 3, Pose[]> = {
  1: [{ className: 'left-[29%] bottom-[11.4%] w-[42%] z-20', depth: 12 }],
  2: [
    { className: 'left-[18%] bottom-[11.2%] w-[35%] -rotate-[1.5deg] z-20', depth: 14 },
    { className: 'left-[49%] bottom-[12.6%] w-[32%] rotate-[1.5deg] z-10', depth: 8 },
  ],
  3: [
    { className: 'left-[33%] bottom-[11.2%] w-[34%] z-30', depth: 15 },
    { className: 'left-[12%] bottom-[12.8%] w-[26%] -rotate-[2.5deg] z-10', depth: 7 },
    { className: 'left-[62%] bottom-[12.8%] w-[26%] rotate-[2.5deg] z-20', depth: 9 },
  ],
};

function useStageParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--px', (x * -1).toFixed(3));
        node.style.setProperty('--py', (y * -0.6).toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty('--px', '0');
      node.style.setProperty('--py', '0');
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}

const depth = (value: number) => ({ '--depth': value }) as CSSProperties;

export function HeroVisual() {
  const { t, i18n } = useTranslation();
  const { books, status } = useBooks();
  const pile = pickHeroBooks(books);
  const stageRef = useStageParallax();
  const set = poses[Math.min(Math.max(pile.length, 1), 3) as 1 | 2 | 3];

  return (
    <div ref={stageRef} className="hero-stage relative isolate mx-auto aspect-[10/9] w-full max-w-[36rem] md:max-w-none">
      <div aria-hidden className="hero-layer showcase-niche" style={depth(3)} />

      <div aria-hidden className="hero-layer showcase-shelf z-[5]" style={depth(2)}>
        <div className="showcase-shelf-top" />
        <div className="showcase-shelf-front" />
      </div>

      {pile.length === 0 ? (
        status === 'loading' ? (
          <div aria-hidden className="absolute bottom-[11.4%] left-[30%] z-20 aspect-[2/3] w-[40%] animate-pulse rounded-[3px_6px_6px_3px] bg-elevated/70" />
        ) : null
      ) : (
        pile.slice(0, 3).map((book, index) => {
          const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
          const pose = set[index] ?? set[0]!;
          return (
            <div key={book.id} className={cn('hero-layer showcase-book', pose.className)} style={depth(pose.depth)}>
              <Link to={`/books/${book.slug}`} aria-label={title} className="hero-book group focus-ring relative isolate block">
                <span aria-hidden className="showcase-cast" />
                <span aria-hidden className="showcase-pages" />
                <div className="showcase-face book-object aspect-[2/3]">
                  <BookCover book={book} labeled={false} priority={index < 2} />
                  <span aria-hidden className="showcase-light" />
                </div>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] rounded-b-[6px] bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-3 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="line-clamp-2 font-display text-xs leading-tight font-medium text-white sm:text-sm">{title}</span>
                  <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.14em] text-white/70 uppercase">
                    {t(`languages.${book.language}`)} · {book.level}
                  </span>
                </span>
              </Link>
              <span aria-hidden className="book-contact" />
            </div>
          );
        })
      )}
    </div>
  );
}
