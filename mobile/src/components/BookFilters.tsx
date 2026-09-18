import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/ThemeProvider';
import { BOOK_LANGUAGES, CEFR_LEVELS, type BookLanguage, type CefrLevel } from '../types/book';

type BookFiltersProps = {
  language: BookLanguage | 'all';
  level: CefrLevel | 'all';
  onLanguageChange: (value: BookLanguage | 'all') => void;
  onLevelChange: (value: CefrLevel | 'all') => void;
};

export function BookFilters({ language, level, onLanguageChange, onLevelChange }: BookFiltersProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <FilterRow label={t('books.language')}>
        <FilterChip active={language === 'all'} onPress={() => onLanguageChange('all')} label={t('books.all')} />
        {BOOK_LANGUAGES.map((code) => (
          <FilterChip
            key={code}
            active={language === code}
            onPress={() => onLanguageChange(code)}
            label={t(`languages.${code}`)}
          />
        ))}
      </FilterRow>
      <FilterRow label={t('books.level')}>
        <FilterChip active={level === 'all'} onPress={() => onLevelChange('all')} label={t('books.allLevels')} />
        {CEFR_LEVELS.map((code) => (
          <FilterChip key={code} active={level === code} onPress={() => onLevelChange(code)} label={code} />
        ))}
      </FilterRow>
    </View>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function FilterChip({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        { borderColor: colors.line, backgroundColor: colors.surface },
        active && { borderColor: colors.accent, backgroundColor: colors.accent },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.onAccent : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  row: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
