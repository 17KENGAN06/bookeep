import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BookCard } from '../components/BookCard';
import { BookGridSkeleton } from '../components/BookGrid';
import { BookFilters } from '../components/BookFilters';
import { PreferencesBar } from '../components/PreferencesBar';
import { isSupabaseConfigured } from '../config/env';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../hooks/ThemeProvider';
import { fetchPublishedBooks } from '../services/books';
import type { Book, BookLanguage, CefrLevel } from '../types/book';

export function CatalogScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { columns, cardWidth, gap } = useLayout();
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState<BookLanguage | 'all'>('all');
  const [level, setLevel] = useState<CefrLevel | 'all'>('all');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('error');
      return;
    }

    let active = true;
    void fetchPublishedBooks()
      .then((next) => {
        if (!active) return;
        setBooks(next);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setRefreshing(true);
    try {
      setBooks(await fetchPublishedBooks());
      setStatus('ready');
    } catch {
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filtered = useMemo(
    () =>
      books.filter(
        (book) =>
          (language === 'all' || book.language === language) && (level === 'all' || book.level === level),
      ),
    [books, language, level],
  );

  const emptyMessage = (() => {
    if (language === 'fi') return t('books.emptyFi');
    if (language === 'en') return t('books.emptyEn');
    if (level !== 'all') return t('books.emptyLevel');
    return t('books.empty');
  })();

  const filtersActive = language !== 'all' || level !== 'all';

  const header = (
    <View style={styles.header}>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('nav.books')}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t('books.title')}</Text>
      <Text style={[styles.lead, { color: colors.muted }]}>{t('books.subtitle')}</Text>
      <PreferencesBar />
      <View style={styles.filters}>
        <BookFilters
          language={language}
          level={level}
          onLanguageChange={setLanguage}
          onLevelChange={setLevel}
        />
      </View>
    </View>
  );

  if (status !== 'ready') {
    return (
      <View style={[styles.safe, { backgroundColor: colors.bg }]}>
        {status === 'loading' ? (
          <View style={styles.list}>
            {header}
            <BookGridSkeleton />
          </View>
        ) : (
          <>
            <View style={styles.list}>{header}</View>
            <View style={styles.center}>
              <Text style={[styles.message, { color: colors.muted }]}>{t('books.errorHint')}</Text>
              <Pressable
                onPress={() => void refresh()}
                style={[styles.secondary, { borderColor: colors.line, backgroundColor: colors.surface }]}
              >
                <Text style={[styles.secondaryText, { color: colors.ink }]}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <FlatList
        key={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={[styles.column, { gap }]}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth, marginBottom: gap }}>
            <BookCard book={item} />
          </View>
        )}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.message, { color: colors.muted }]}>{emptyMessage}</Text>
            {filtersActive ? (
              <Pressable
                onPress={() => {
                  setLanguage('all');
                  setLevel('all');
                }}
                style={[styles.secondary, { borderColor: colors.line, backgroundColor: colors.surface }]}
              >
                <Text style={[styles.secondaryText, { color: colors.ink }]}>{t('books.showAll')}</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
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
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
  },
  filters: {
    marginTop: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 20,
  },
  column: {
    justifyContent: 'flex-start',
  },
  empty: {
    paddingTop: 24,
    alignItems: 'center',
  },
  secondary: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
