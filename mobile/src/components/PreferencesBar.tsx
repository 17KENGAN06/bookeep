import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useTheme } from '../hooks/ThemeProvider';
import { supportedLanguages, type AppLanguage } from '../i18n';

export function PreferencesBar() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'en') as AppLanguage;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{t('common.language')}</Text>
      <View style={styles.row}>
        {supportedLanguages.map((language) => {
          const active = current === language.code;
          return (
            <Pressable
              key={language.code}
              onPress={() => {
                void i18n.changeLanguage(language.code);
              }}
              style={[
                styles.chip,
                { borderColor: colors.line, backgroundColor: colors.surface },
                active && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? colors.accent : colors.muted }]}>{language.short}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={toggleTheme}
          style={[styles.chip, styles.themeChip, { borderColor: colors.line, backgroundColor: colors.surface }]}
          accessibilityLabel={isDark ? t('common.themeLight') : t('common.themeDark')}
        >
          <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    marginRight: 8,
    marginBottom: 6,
    minWidth: 40,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeChip: {
    marginLeft: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
