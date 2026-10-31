import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookCover } from '@/components/books/BookCover';
import { useBooks } from '@/hooks/useBooks';
import { pickHeroBooks } from '@/services/books';
import { getLocalizedTitle } from '@/utils/bookCopy';
import { cn } from '@/utils/cn';

type Pose = { className: string; depth: number };

// Books stand on the ledge (its top edge is at 17% from the bottom of the stage).
const poses: Record<1 | 2 | 3, Pose[]> = {
  1: [{ className: 'right-[24%] w-[46%] rotate-[1.5deg] z-20', depth: 12 }],
  2: [
    { className: 'right-[8%] w-[44%] rotate-[2deg] z-20', depth: 10 },
    { className: 'left-[12%] w-[35%] -rotate-[3deg] z-30', depth: 16 },
  ],
  3: [
    { className: 'right-[7%] w-[42%] rotate-[2deg] z-20', depth: 10 },
    { className: 'left-[22%] w-[33%] -rotate-[2.5deg] z-30', depth: 16 },
    { className: 'left-[1%] w-[27%] -rotate-[7deg] z-10', depth: 7 },
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

/** A hardcover lying flat, seen from the front: board, page block, board. */
function ClosedBook({ className, tone, band = false }: { className?: string; tone: string; band?: boolean }) {
  return (
    <div
      className={cn('relative h-[0.95rem] rounded-[2px_4px_4px_2px] sm:h-[1.25rem]', className)}
      style={{ background: `linear-gradient(180deg, ${tone}, #0c1211)` }}
    >
      <span className="absolute inset-x-[3px] top-[22%] bottom-[22%] rounded-[1px] bg-[linear-gradient(180deg,#d9dccd,#a9ae9e)] opacity-[0.32]" />
      <span className="absolute inset-x-0 top-0 h-px bg-white/10" />
      {band ? <span className="absolute inset-y-0 left-[14%] w-[5%] bg-accent/25" /> : null}
    </div>
  );
}

export function HeroVisual() {
  const { t, i18n } = useTranslation();
  const { books, status } = useBooks();
  const pile = pickHeroBooks(books);
  const stageRef = useStageParallax();
  const set = poses[Math.min(Math.max(pile.length, 1), 3) as 1 | 2 | 3];

  return (
    <div ref={stageRef} className="hero-stage relative isolate mx-auto aspect-[10/9] w-full max-w-[40rem] md:max-w-none">
      {/* glass frame behind the books */}
      <div className="hero-layer absolute top-[3%] right-[2%] bottom-[14%] left-[24%]" style={depth(4)} aria-hidden>
        <div className="absolute inset-0 rounded-[2rem] border border-white/[0.09] bg-[linear-gradient(160deg,rgba(220,255,240,0.07),rgba(220,255,240,0.015)_45%,rgba(0,0,0,0.12))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-[2px] sm:rounded-[2.5rem]" />
        <div className="absolute inset-3 rounded-[1.6rem] border border-white/[0.05] sm:inset-4 sm:rounded-[2rem]" />
      </div>

      {/* lamp light falling on the books */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-8%] right-[-6%] z-[35] h-[70%] w-[70%] bg-[radial-gradient(closest-side,rgba(235,250,240,0.14),transparent)] mix-blend-screen"
      />

      {/* stone ledge */}
      <div
        aria-hidden
        className="hero-layer absolute right-[-30%] bottom-0 left-[-14%] h-[17%] [mask-image:linear-gradient(90deg,transparent,#000_16%,#000)]"
        style={depth(2)}
      >
        <div className="stone-ledge inset-0" />
        <div className="ledge-front absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-black/50 to-black/85 shadow-[inset_0_1px_0_rgba(200,245,225,0.12)]" />
        <div className="absolute inset-x-0 -bottom-px h-[30%] bg-gradient-to-b from-transparent to-bg" />
      </div>

      {/* two closed books lying on the ledge */}
      <div aria-hidden className="hero-layer absolute bottom-[16.6%] left-[-4%] z-[15] w-[42%]" style={depth(6)}>
        <ClosedBook className="ml-[10%] w-[86%]" tone="#24302d" band />
        <ClosedBook className="w-full" tone="#1a2422" />
      </div>

      {pile.length === 0 ? (
        status === 'loading' ? (
          <div aria-hidden className="absolute right-[8%] bottom-[16.5%] z-20 aspect-[2/3] w-[42%] animate-pulse rounded-[3px_6px_6px_3px] bg-elevated/70" />
        ) : null
      ) : (
        pile.slice(0, 3).map((book, index) => {
          const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? 'en');
          const pose = set[index] ?? set[0]!;
          return (
            <div key={book.id} className={cn('hero-layer absolute bottom-[16.2%]', pose.className)} style={depth(pose.depth)}>
              <Link
                to={`/books/${book.slug}`}
                aria-label={title}
                className="hero-book group focus-ring book-object block"
              >
                <div className="aspect-[2/3]">
                  <BookCover book={book} labeled={false} priority={index < 2} />
                </div>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-3 opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
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
