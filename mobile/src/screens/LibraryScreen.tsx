import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookGrid, BookGridSkeleton } from '../components/BookGrid';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '../hooks/ThemeProvider';
import { useLayout } from '../hooks/useLayout';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '../hooks/useNavigation';
import { fetchPublishedBooks } from '../services/books';
import type { Book } from '../types/book';

function pickBooks(books: Book[], ids: string[]) {
  const byId = new Map(books.map((book) => [book.id, book]));
  return ids.map((id) => byId.get(id)).filter((book): book is Book => Boolean(book));
}

export function LibraryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isWide } = useLayout();
  const { user, isLoading } = useAuth();
  const { openAuth } = useNavigation();
  const { favoriteIds, plannedIds, progress, loading, reload } = useLibrary();
  const [books, setBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }
    let active = true;
    void fetchPublishedBooks()
      .then((next) => {
        if (active) setBooks(next);
      })
      .catch(() => {
        if (active) setBooks([]);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextBooks] = await Promise.all([fetchPublishedBooks(), reload()]);
      setBooks(nextBooks);
    } catch {
      // keep the shelves as they are
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const liked = useMemo(() => pickBooks(books, favoriteIds), [books, favoriteIds]);
  const planned = useMemo(() => pickBooks(books, plannedIds), [books, plannedIds]);
  const historyIds = useMemo(
    () =>
      Object.entries(progress)
        .sort((a, b) => b[1].lastReadAt.localeCompare(a[1].lastReadAt))
        .map(([id]) => id),
    [progress],
  );
  const history = useMemo(() => pickBooks(books, historyIds), [books, historyIds]);

  if (isLoading) {
    return <View style={[styles.pad, { backgroundColor: colors.bg }]} />;
  }

  if (!user) {
    return (
      <View style={[styles.pad, { backgroundColor: colors.bg }]}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('library.eyebrow')}</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{t('library.guestTitle')}</Text>
        <Text style={[styles.lead, { color: colors.muted }]}>{t('library.guestHint')}</Text>
        <Pressable
          style={[styles.primary, isWide && styles.ctaWide, { backgroundColor: colors.accent }]}
          onPress={openAuth}
        >
          <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t('nav.login')}</Text>
        </Pressable>
      </View>
    );
  }

  const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || '');

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />
      }
    >
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('library.eyebrow')}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t('library.title')}</Text>
      <Text style={[styles.lead, { color: colors.muted }]}>{t('library.hello', { name })}</Text>
      {loading ? (
        <View style={styles.skeleton}>
          <BookGridSkeleton />
        </View>
      ) : (
        <>
          <Shelf title={t('library.liked')} empty={t('library.likedEmpty')} books={liked} />
          <Shelf title={t('library.planned')} empty={t('library.plannedEmpty')} books={planned} />
          <Shelf title={t('library.history')} empty={t('library.historyEmpty')} books={history} />
        </>
      )}
    </ScrollView>
  );
}

function Shelf({ title, empty, books }: { title: string; empty: string; books: Book[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.shelf}>
      <Text style={[styles.shelfTitle, { color: colors.ink }]}>{title}</Text>
      {books.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>{empty}</Text>
      ) : (
        <BookGrid books={books} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  lead: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  skeleton: {
    marginTop: 28,
  },
  primary: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWide: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
  },
  primaryText: {
    fontWeight: '700',
    fontSize: 15,
  },
  shelf: {
    marginTop: 28,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
});
