import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookCover } from './BookCover';
import { LevelBadge } from './LevelBadge';
import { LibraryActions } from './LibraryActions';
import { useTheme } from '../hooks/ThemeProvider';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '../hooks/useNavigation';
import type { Book } from '../types/book';
import { getLocalizedTitle } from '../utils/bookCopy';

export function BookCard({ book }: { book: Book }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { openBook } = useNavigation();
  const { progress } = useLibrary();
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? i18n.language);
  const percent = progress[book.id]?.percentage ?? 0;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => openBook(book)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.line },
          pressed && { borderColor: colors.accent },
        ]}
      >
        <View style={[styles.coverBox, { backgroundColor: colors.surface2 }]}>
          <BookCover book={book} labeled={false} />
        </View>
        <View style={styles.meta}>
          <View style={styles.metaText}>
            <Text numberOfLines={2} style={[styles.title, { color: colors.ink }]}>
              {title}
            </Text>
            <Text style={[styles.language, { color: colors.muted }]}>{t(`languages.${book.language}`)}</Text>
            {percent > 0 ? (
              <View style={styles.progress}>
                <Text style={[styles.progressLabel, { color: colors.muted }]}>{t('books.progress')}</Text>
                <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
                  <View style={[styles.fill, { width: `${Math.min(100, percent)}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>
            ) : null}
          </View>
          <LevelBadge level={book.level} />
        </View>
      </Pressable>
      <View style={styles.actions}>
        <LibraryActions bookId={book.id} compact />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    position: 'relative',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverBox: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
  },
  metaText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  language: {
    marginTop: 4,
    fontSize: 13,
  },
  progress: {
    marginTop: 10,
    gap: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  track: {
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 99,
  },
  actions: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
