import type { Book } from '@/types/book';
import { BookCard } from '@/components/books/BookCard';
import { BookCardSkeleton } from '@/components/common/Skeleton';
import { Reveal } from '@/components/common/Reveal';
import { cn } from '@/utils/cn';

type BookGridProps = {
  books: Book[];
  isLoading?: boolean;
  /** Placeholder count while loading. */
  skeletons?: number;
};

const gridClass = 'grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5 xl:grid-cols-3';

export function BookGrid({ books, isLoading = false, skeletons = 6 }: BookGridProps) {
  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletons }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // One or two books keep a comfortable card width instead of stretching across the row.
  return (
    <div className={cn(gridClass, books.length === 1 && 'xl:grid-cols-2')}>
      {books.map((book, index) => (
        <Reveal key={book.id} className="h-full" delay={Math.min(index * 70, 420)} direction="scale">
          <BookCard book={book} />
        </Reveal>
      ))}
    </div>
  );
}
