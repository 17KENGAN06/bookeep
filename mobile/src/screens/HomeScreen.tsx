import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BookGrid, BookGridSkeleton } from '../components/BookGrid';
import { PreferencesBar } from '../components/PreferencesBar';
import { isSupabaseConfigured } from '../config/env';
import { useLayout } from '../hooks/useLayout';
import { useTheme } from '../hooks/ThemeProvider';
import { useNavigation } from '../hooks/useNavigation';
import { fetchPublishedBooks } from '../services/books';
import type { Book } from '../types/book';

const MOODS = ['adaptation', 'languages', 'levels'] as const;

export function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide, columns } = useLayout();
  const { setTab } = useNavigation();
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('error');
      return;
    }

    let active = true;
    void fetchPublishedBooks()
      .then((next) => {
        if (!active) return;
        setBooks(next.slice(0, 8));
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
    >
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('home.eyebrow')}</Text>
      <Text style={[styles.hero, isWide && styles.heroWide, { color: colors.ink }]}>{t('home.line1')}</Text>
      <Text style={[styles.hero, isWide && styles.heroWide, { color: colors.ink }]}>{t('home.line2')}</Text>
      <Text style={[styles.hero, isWide && styles.heroWide, { color: colors.accent }]}>{t('home.line3')}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t('home.subtitle')}</Text>

      <Pressable
        style={[styles.primary, isWide && styles.ctaWide, { backgroundColor: colors.accent }]}
        onPress={() => setTab('catalog')}
      >
        <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t('home.ctaPrimary')}</Text>
      </Pressable>

      <PreferencesBar />

      <View style={[styles.moods, isWide && styles.moodsWide]}>
        {MOODS.map((mood) => (
          <View
            key={mood}
            style={[styles.mood, isWide && styles.moodWide, { borderColor: colors.line, backgroundColor: colors.surface }]}
          >
            <Text style={[styles.moodTitle, { color: colors.ink }]}>{t(`home.moods.${mood}.title`)}</Text>
            <Text style={[styles.moodText, { color: colors.muted }]}>{t(`home.moods.${mood}.text`)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.featuredHead}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('home.featuredTitle')}</Text>
        <Text style={[styles.sectionLead, { color: colors.muted }]}>{t('home.featuredSubtitle')}</Text>
      </View>

        {status === 'loading' ? (
        <BookGridSkeleton />
      ) : status === 'error' ? (
        <Text style={[styles.sectionLead, { color: colors.muted }]}>{t('books.errorHint')}</Text>
      ) : (
        <BookGrid books={books.slice(0, columns * 2)} />
      )}

      <Pressable
        style={[styles.secondary, isWide && styles.ctaWide, { borderColor: colors.line, backgroundColor: colors.surface }]}
        onPress={() => setTab('catalog')}
      >
        <Text style={[styles.secondaryText, { color: colors.ink }]}>{t('home.viewAll')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  hero: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 39,
  },
  heroWide: {
    fontSize: 44,
    lineHeight: 50,
  },
  subtitle: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  primary: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWide: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  moods: {
    marginTop: 18,
    gap: 12,
  },
  moodsWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  mood: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  moodWide: {
    flex: 1,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  moodText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  featuredHead: {
    marginTop: 32,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionLead: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  secondary: {
    marginTop: 18,
    minHeight: 48,
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
