import { StyleSheet, View } from 'react-native';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import { useLayout } from '../hooks/useLayout';
import type { Book } from '../types/book';

export function BookGrid({ books }: { books: Book[] }) {
  const { cardWidth, gap } = useLayout();

  return (
    <View style={[styles.grid, { gap }]}>
      {books.map((book) => (
        <View key={book.id} style={{ width: cardWidth }}>
          <BookCard book={book} />
        </View>
      ))}
    </View>
  );
}

export function BookGridSkeleton({ count }: { count?: number }) {
  const { cardWidth, gap, columns } = useLayout();
  const items = count ?? columns * 2;

  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: items }, (_, index) => (
        <View key={index} style={{ width: cardWidth }}>
          <BookCardSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
