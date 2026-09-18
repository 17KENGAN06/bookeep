import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { PdfPageView } from '../components/PdfPageView';
import { PDF_DIM_STORAGE_KEY, PDF_PAPER_STORAGE_KEY } from '../config/storage';
import { useDownloads } from '../hooks/useDownloads';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '../hooks/useNavigation';
import { useTheme } from '../hooks/ThemeProvider';
import { getLocalizedTitle } from '../utils/bookCopy';

const DIM_STEPS = [0, 0.16, 0.3, 0.44];

function nextDim(current: number) {
  const index = DIM_STEPS.findIndex((step) => Math.abs(step - current) < 0.01);
  return DIM_STEPS[(index < 0 ? 0 : index + 1) % DIM_STEPS.length];
}

export function ReaderScreen() {
  useKeepAwake();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { readerBook, closeReader } = useNavigation();
  const { progress, recordProgress } = useLibrary();
  const { localUri, download } = useDownloads();
  const book = readerBook;
  const saved = book ? progress[book.id] : undefined;
  const [readUri] = useState(() => (book ? localUri(book) ?? book.pdf_path : null));
  const [page, setPage] = useState(saved?.currentPage ?? 1);
  const [total, setTotal] = useState(saved?.totalPages ?? 0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [nightPaper, setNightPaper] = useState(false);
  const [dim, setDim] = useState(0);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageRef = useRef(page);
  const totalRef = useRef(total);
  pageRef.current = page;
  totalRef.current = total;

  useEffect(() => {
    void AsyncStorage.multiGet([PDF_PAPER_STORAGE_KEY, PDF_DIM_STORAGE_KEY]).then((entries) => {
      const stored = Object.fromEntries(entries);
      if (stored[PDF_PAPER_STORAGE_KEY] === 'dark') setNightPaper(true);
      const parsed = Number.parseFloat(stored[PDF_DIM_STORAGE_KEY] ?? '');
      if (Number.isFinite(parsed) && parsed > 0) setDim(Math.min(0.5, parsed));
    });
  }, []);

  useEffect(() => {
    if (!book?.pdf_path || localUri(book)) return;
    void download(book);
  }, [book, download, localUri]);

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      if (book && totalRef.current > 0) {
        recordProgress(book.id, { currentPage: pageRef.current, totalPages: totalRef.current });
      }
    };
  }, [book, recordProgress]);

  const persist = useCallback(
    (currentPage: number, totalPages: number) => {
      if (!book || totalPages <= 0) return;
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        recordProgress(book.id, { currentPage, totalPages });
      }, 400);
    },
    [book, recordProgress],
  );

  const goTo = useCallback(
    (next: number) => {
      if (totalRef.current <= 0) return;
      const target = Math.min(totalRef.current, Math.max(1, next));
      setPage(target);
      persist(target, totalRef.current);
    },
    [persist],
  );

  function togglePaper() {
    setNightPaper((current) => {
      const next = !current;
      void AsyncStorage.setItem(PDF_PAPER_STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }

  function cycleDim() {
    setDim((current) => {
      const next = nextDim(current);
      void AsyncStorage.setItem(PDF_DIM_STORAGE_KEY, String(next));
      return next;
    });
  }

  if (!book) return null;

  if (!book.pdf_path) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
        <Pressable onPress={closeReader} style={[styles.barButton, styles.missingBack]} accessibilityLabel={t('reader.back')}>
          <Icon name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
        <View style={styles.center}>
          <Text style={[styles.messageTitle, { color: colors.ink }]}>{t('reader.missing')}</Text>
          <Text style={[styles.message, { color: colors.muted }]}>{t('reader.missingHint')}</Text>
        </View>
      </View>
    );
  }

  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? i18n.language);

  function submitJump() {
    const parsed = Number.parseInt(jumpValue, 10);
    Keyboard.dismiss();
    setJumpOpen(false);
    setJumpValue('');
    if (Number.isFinite(parsed)) goTo(parsed);
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <View style={[styles.bar, { borderBottomColor: colors.line }]}>
        <Pressable onPress={closeReader} hitSlop={8} style={styles.barButton} accessibilityLabel={t('book.backToCatalog')}>
          <Icon name="chevron-back" size={24} color={colors.accent} />
        </Pressable>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={cycleDim}
          accessibilityLabel={t('reader.dim')}
          style={[
            styles.iconButton,
            { borderColor: colors.line },
            dim > 0 && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
          ]}
        >
          <Icon
            name={dim > 0.2 ? 'sunny' : dim > 0 ? 'partly-sunny' : 'sunny-outline'}
            size={16}
            color={dim > 0 ? colors.accent : colors.ink}
          />
        </Pressable>
        <Pressable
          onPress={togglePaper}
          accessibilityLabel={nightPaper ? t('reader.paperLight') : t('reader.paperDark')}
          style={[
            styles.iconButton,
            { borderColor: colors.line },
            nightPaper && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
          ]}
        >
          <Icon name={nightPaper ? 'moon' : 'moon-outline'} size={16} color={nightPaper ? colors.accent : colors.ink} />
        </Pressable>
      </View>

      {status === 'error' ? (
        <View style={styles.center}>
          <Text style={[styles.messageTitle, { color: colors.ink }]}>{t('reader.error')}</Text>
          <Text style={[styles.message, { color: colors.muted }]}>{t('reader.errorHint')}</Text>
        </View>
      ) : (
        <View style={styles.stage}>
          <PdfPageView
            uri={readUri ?? book.pdf_path}
            page={page}
            nightPaper={nightPaper}
            background={nightPaper ? '#111111' : colors.bg}
            onReady={(numPages) => {
              setTotal(numPages);
              totalRef.current = numPages;
              setStatus('ready');
              const start = Math.min(numPages, Math.max(1, saved?.currentPage ?? 1));
              setPage(start);
              persist(start, numPages);
            }}
            onError={() => setStatus('error')}
            onTurnPage={(delta) => goTo(pageRef.current + delta)}
          />
          {dim > 0 ? <View pointerEvents="none" style={[styles.dim, { opacity: dim }]} /> : null}
        </View>
      )}

      {status === 'loading' ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {jumpOpen ? (
        <View style={[styles.jump, { borderTopColor: colors.line, backgroundColor: colors.surface }]}>
          <TextInput
            autoFocus
            keyboardType="number-pad"
            returnKeyType="go"
            value={jumpValue}
            onChangeText={setJumpValue}
            onSubmitEditing={submitJump}
            placeholder={t('reader.skipToPage')}
            placeholderTextColor={colors.placeholder}
            style={[styles.jumpInput, { borderColor: colors.line, color: colors.ink, backgroundColor: colors.bg }]}
          />
          <Pressable onPress={submitJump} style={[styles.jumpGo, { backgroundColor: colors.accent }]}>
            <Text style={[styles.jumpGoText, { color: colors.onAccent }]}>OK</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.controls,
          { borderTopColor: colors.line, backgroundColor: colors.surface, paddingBottom: insets.bottom },
        ]}
      >
        <Pressable style={styles.control} onPress={() => goTo(page - 1)} disabled={page <= 1}>
          <Icon name="chevron-back" size={18} color={page <= 1 ? colors.muted : colors.ink} />
          <Text style={[styles.controlText, { color: page <= 1 ? colors.muted : colors.ink }]}>
            {t('reader.prev')}
          </Text>
        </Pressable>
        <Pressable
          style={styles.counter}
          onPress={() => {
            setJumpValue(String(page));
            setJumpOpen((open) => !open);
          }}
        >
          <Text style={[styles.counterText, { color: colors.muted }]}>
            {total > 0 ? `${page} / ${total}` : '—'}
          </Text>
        </Pressable>
        <Pressable style={styles.control} onPress={() => goTo(page + 1)} disabled={total > 0 && page >= total}>
          <Text style={[styles.controlText, { color: total > 0 && page >= total ? colors.muted : colors.ink }]}>
            {t('reader.next')}
          </Text>
          <Icon name="chevron-forward" size={18} color={total > 0 && page >= total ? colors.muted : colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  bar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  barButton: {
    paddingHorizontal: 4,
  },
  missingBack: {
    padding: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  messageTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 21,
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jump: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderTopWidth: 1,
  },
  jumpInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  jumpGo: {
    minWidth: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpGoText: {
    fontSize: 15,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  control: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  controlText: {
    fontWeight: '700',
  },
  counter: {
    minWidth: 88,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
