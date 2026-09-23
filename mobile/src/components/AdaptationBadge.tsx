import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useTheme } from '../hooks/ThemeProvider';

export function AdaptationBadge({
  complete,
  variant = 'badge',
}: {
  complete: boolean;
  variant?: 'badge' | 'banner';
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = complete ? t('book.adaptationComplete') : t('book.adaptationInProgress');
  const hint = complete ? t('book.adaptationCompleteHint') : t('book.adaptationInProgressHint');

  if (variant === 'banner') {
    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: complete ? colors.accentSoft : colors.surface2,
            borderColor: complete ? colors.accent : colors.line,
          },
        ]}
      >
        <Icon name={complete ? 'checkmark-circle' : 'create-outline'} size={20} color={complete ? colors.accent : colors.ink} />
        <View style={styles.bannerCopy}>
          <Text style={[styles.bannerTitle, { color: complete ? colors.accent : colors.ink }]}>{title}</Text>
          <Text style={[styles.bannerHint, { color: colors.muted }]}>{hint}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: complete ? colors.accent : colors.ink }]}>
      <Text style={[styles.badgeText, { color: colors.onAccent }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerHint: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
});
