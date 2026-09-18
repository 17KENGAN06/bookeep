import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useAuth } from '../hooks/AuthProvider';
import { useTheme } from '../hooks/ThemeProvider';
import { useToast } from '../hooks/ToastProvider';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '../hooks/useNavigation';

type LibraryActionsProps = {
  bookId: string;
  compact?: boolean;
};

export function LibraryActions({ bookId, compact = false }: LibraryActionsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { openAuth } = useNavigation();
  const { notify } = useToast();
  const { isFavorite, isPlanned, toggleFavorite, togglePlanned } = useLibrary();
  const liked = isFavorite(bookId);
  const planned = isPlanned(bookId);

  function run(action: (id: string) => Promise<boolean>) {
    if (!user) {
      openAuth();
      return;
    }
    void (async () => {
      const ok = await action(bookId);
      if (!ok) notify(t('library.error'), 'error');
    })();
  }

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Pressable
          hitSlop={6}
          accessibilityLabel={liked ? t('library.unlike') : t('library.like')}
          onPress={() => run(toggleFavorite)}
          style={[
            styles.iconButton,
            { borderColor: colors.line, backgroundColor: colors.surface },
            liked && { borderColor: colors.accent },
          ]}
        >
          <Icon name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.accent : colors.muted} />
        </Pressable>
        <Pressable
          hitSlop={6}
          accessibilityLabel={planned ? t('library.unplan') : t('library.plan')}
          onPress={() => run(togglePlanned)}
          style={[
            styles.iconButton,
            { borderColor: colors.line, backgroundColor: colors.surface },
            planned && { borderColor: colors.accent },
          ]}
        >
          <Icon
            name={planned ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={planned ? colors.accent : colors.muted}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => run(toggleFavorite)}
        style={[
          styles.button,
          { borderColor: colors.line, backgroundColor: colors.surface },
          liked && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
        ]}
      >
        <View style={styles.buttonInner}>
          <Icon name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.accent : colors.ink} />
          <Text style={[styles.buttonText, { color: liked ? colors.accent : colors.ink }]}>
            {liked ? t('library.unlike') : t('library.like')}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => run(togglePlanned)}
        style={[
          styles.button,
          { borderColor: colors.line, backgroundColor: colors.surface },
          planned && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
        ]}
      >
        <View style={styles.buttonInner}>
          <Icon
            name={planned ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={planned ? colors.accent : colors.ink}
          />
          <Text style={[styles.buttonText, { color: planned ? colors.accent : colors.ink }]}>
            {planned ? t('library.unplan') : t('library.plan')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
