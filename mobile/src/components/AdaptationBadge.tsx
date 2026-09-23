import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/ThemeProvider';

export function AdaptationBadge({ complete }: { complete: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: complete ? colors.accentSoft : colors.surface2 }]}>
      <Text style={[styles.text, { color: complete ? colors.accent : colors.muted }]}>
        {complete ? t('book.adaptationComplete') : t('book.adaptationInProgress')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
