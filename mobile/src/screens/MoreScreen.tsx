import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { PreferencesBar } from '../components/PreferencesBar';
import { useAuth } from '../hooks/AuthProvider';
import { ARTICLE_MAX, useLayout } from '../hooks/useLayout';
import { useTheme } from '../hooks/ThemeProvider';
import { useNavigation, type InfoPage } from '../hooks/useNavigation';

const PAGES: { id: InfoPage; titleKey: string; leadKey: string }[] = [
  { id: 'about', titleKey: 'about.title', leadKey: 'about.lead' },
  { id: 'contact', titleKey: 'contact.title', leadKey: 'contact.lead' },
  { id: 'privacy', titleKey: 'privacy.title', leadKey: 'privacy.lead' },
];

export function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { openInfo, openAuth } = useNavigation();
  const { user } = useAuth();

  const accountName = user
    ? String(user.user_metadata?.full_name || user.user_metadata?.name || user.email || '')
    : t('more.accountHint');

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 32 },
        isWide && { maxWidth: ARTICLE_MAX, width: '100%', alignSelf: 'center' },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('common.appName')}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{t('more.title')}</Text>
      <Text style={[styles.lead, { color: colors.muted }]}>{t('more.lead')}</Text>
      <PreferencesBar />

      <View style={styles.list}>
        <Row
          title={user ? t('more.account') : t('nav.login')}
          lead={accountName}
          onPress={openAuth}
        />
        {PAGES.map((page) => (
          <Row key={page.id} title={t(page.titleKey)} lead={t(page.leadKey)} onPress={() => openInfo(page.id)} />
        ))}
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>{t('footer.tagline')}</Text>
    </ScrollView>
  );
}

function Row({ title, lead, onPress }: { title: string; lead: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.line, backgroundColor: colors.surface },
        pressed && { borderColor: colors.accent },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.ink }]}>{title}</Text>
        <Text numberOfLines={2} style={[styles.rowLead, { color: colors.muted }]}>
          {lead}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  lead: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    marginTop: 18,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  rowLead: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 28,
    fontSize: 13,
    lineHeight: 19,
  },
});
