import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { ARTICLE_MAX, useLayout } from '../hooks/useLayout';
import { useTheme } from '../hooks/ThemeProvider';
import { useNavigation } from '../hooks/useNavigation';
import { ADMIN_EMAIL } from '../config/contact';
import { stripCopyTags } from '../utils/copy';

const ABOUT_SECTIONS = ['purpose', 'adaptation', 'languages', 'levels', 'reading'] as const;
const PRIVACY_SECTIONS = ['who', 'data', 'account', 'form', 'local', 'sharing', 'rights'] as const;

export function InfoScreen({ page }: { page: 'about' | 'privacy' }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { closeInfo, setTab } = useNavigation();
  const sections = page === 'about' ? ABOUT_SECTIONS : PRIVACY_SECTIONS;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 32 },
        isWide && { maxWidth: ARTICLE_MAX, width: '100%', alignSelf: 'center' },
      ]}
    >
      <Pressable onPress={closeInfo} hitSlop={8} style={styles.backRow}>
        <Icon name="chevron-back" size={20} color={colors.muted} />
        <Text style={[styles.back, { color: colors.muted }]}>{t('reader.back')}</Text>
      </Pressable>

      <Text style={[styles.eyebrow, { color: colors.accent }]}>{t(`${page}.eyebrow`)}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t(`${page}.title`)}</Text>
      <Text style={[styles.lead, { color: colors.muted }]}>{t(`${page}.lead`)}</Text>

      <View style={styles.sections}>
        {sections.map((section) => (
          <View key={section}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              {t(`${page}.sections.${section}.title`)}
            </Text>
            <Text style={[styles.sectionText, { color: colors.muted }]}>
              {stripCopyTags(t(`${page}.sections.${section}.text`, { email: ADMIN_EMAIL }))}
            </Text>
          </View>
        ))}
      </View>

      {page === 'about' ? (
        <Pressable
          style={[styles.primary, { backgroundColor: colors.accent }]}
          onPress={() => setTab('catalog')}
        >
          <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t('about.cta')}</Text>
        </Pressable>
      ) : null}
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
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  sections: {
    marginTop: 28,
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
  },
  primary: {
    marginTop: 32,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
