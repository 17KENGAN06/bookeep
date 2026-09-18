import { ActivityIndicator, ScrollView, Share, StyleSheet, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BookCover } from '../components/BookCover';
import { Icon } from '../components/Icon';
import { LevelBadge } from '../components/LevelBadge';
import { LibraryActions } from '../components/LibraryActions';
import { webBookUrl } from '../config/site';
import { useDownloads } from '../hooks/useDownloads';
import { useLayout } from '../hooks/useLayout';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '../hooks/useNavigation';
import { useTheme } from '../hooks/ThemeProvider';
import { useToast } from '../hooks/ToastProvider';
import { getLocalizedDescription, getLocalizedTitle } from '../utils/bookCopy';

export function BookDetailsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { detailBook, closeBook, openReader } = useNavigation();
  const { progress } = useLibrary();
  const { localUri, isBusy, download, remove } = useDownloads();
  const { notify } = useToast();

  const book = detailBook;
  if (!book) return null;

  const language = i18n.resolvedLanguage ?? i18n.language;
  const title = getLocalizedTitle(book, language);
  const description = getLocalizedDescription(book, language);
  const saved = progress[book.id];
  const hasProgress = Boolean(saved && saved.currentPage > 1);
  const downloaded = Boolean(localUri(book));
  const shareUrl = webBookUrl(book.slug);

  async function shareBook() {
    try {
      await Share.share({
        title,
        message: `${title}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // Dismissing the share sheet is not an error.
    }
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Pressable onPress={closeBook} hitSlop={8} style={styles.backRow}>
          <Icon name="chevron-back" size={20} color={colors.muted} />
          <Text style={[styles.back, { color: colors.muted }]}>{t('book.backToCatalog')}</Text>
        </Pressable>

        <View style={isWide ? styles.heroRow : undefined}>
          <View style={[styles.coverBox, { borderColor: colors.line, backgroundColor: colors.surface2 }, isWide && styles.coverWide]}>
            <BookCover book={book} />
          </View>

          <View style={isWide ? styles.heroCopy : undefined}>
            <View style={[styles.badges, isWide && styles.badgesWide]}>
              <LevelBadge level={book.level} />
              <Text style={[styles.language, { color: colors.muted }]}>{t(`languages.${book.language}`)}</Text>
            </View>

            <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
            {book.title_original !== title ? (
              <Text style={[styles.original, { color: colors.muted }]}>{book.title_original}</Text>
            ) : null}

            {description ? <Text style={[styles.description, { color: colors.muted }]}>{description}</Text> : null}

            <Pressable
              style={[styles.primary, isWide && styles.ctaWide, { backgroundColor: colors.accent }]}
              onPress={() => openReader(book)}
            >
              <Text style={[styles.primaryText, { color: colors.onAccent }]}>
                {hasProgress ? t('book.continueReading') : t('book.startReading')}
              </Text>
            </Pressable>
            {hasProgress && saved ? (
              <Text style={[styles.hint, { color: colors.muted }]}>
                {t('book.continueFrom', { page: saved.currentPage })}
              </Text>
            ) : null}

            {book.pdf_path ? (
              <Pressable
                style={[styles.secondary, isWide && styles.ctaWide, { borderColor: colors.line, backgroundColor: colors.surface }]}
                disabled={isBusy(book.id)}
                onPress={() => {
                  if (downloaded) {
                    remove(book);
                    notify(t('book.downloadRemoved'));
                    return;
                  }
                  void (async () => {
                    const ok = await download(book);
                    notify(ok ? t('book.downloadDone') : t('book.downloadError'), ok ? 'info' : 'error');
                  })();
                }}
              >
                {isBusy(book.id) ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <View style={styles.secondaryInner}>
                    <Icon name={downloaded ? 'trash-outline' : 'download-outline'} size={16} color={colors.ink} />
                    <Text style={[styles.secondaryText, { color: colors.ink }]}>
                      {downloaded ? t('book.downloadedRemove') : t('book.download')}
                    </Text>
                  </View>
                )}
              </Pressable>
            ) : null}
            {downloaded ? <Text style={[styles.hint, { color: colors.muted }]}>{t('book.offlineHint')}</Text> : null}

            <Pressable
              style={[styles.secondary, isWide && styles.ctaWide, { borderColor: colors.line, backgroundColor: colors.surface }]}
              onPress={() => {
                void shareBook();
              }}
            >
              <View style={styles.secondaryInner}>
                <Icon name="share-outline" size={16} color={colors.ink} />
                <Text style={[styles.secondaryText, { color: colors.ink }]}>{t('book.share')}</Text>
              </View>
            </Pressable>

            <View style={styles.actions}>
              <LibraryActions bookId={book.id} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 16,
  },
  back: {
    fontSize: 15,
    fontWeight: '600',
  },
  coverBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
  },
  coverWide: {
    width: 280,
    maxWidth: '40%',
    flexShrink: 0,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  badgesWide: {
    marginTop: 0,
  },
  language: {
    fontSize: 14,
  },
  title: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  original: {
    marginTop: 6,
    fontSize: 14,
  },
  description: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
  },
  primary: {
    marginTop: 24,
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
  hint: {
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  secondary: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    marginTop: 14,
  },
});
