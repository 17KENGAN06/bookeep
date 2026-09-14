import type { Book } from '@/types/book';
import { BookCard } from '@/components/books/BookCard';
import { BookCardSkeleton } from '@/components/common/Skeleton';
import { Reveal } from '@/components/common/Reveal';

type BookGridProps = {
  books: Book[];
  isLoading?: boolean;
};

export function BookGrid({ books, isLoading = false }: BookGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <BookCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book, index) => (
        <Reveal key={book.id} className="h-full" delay={Math.min(index * 70, 420)} direction="scale">
          <BookCard book={book} />
        </Reveal>
      ))}
    </div>
  );
}
