import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STAGE_MAX, TAB_MAX, useLayout } from './src/hooks/useLayout';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Icon, type IconName } from './src/components/Icon';
import { AuthProvider, useAuth } from './src/hooks/AuthProvider';
import { ThemeProvider, useTheme } from './src/hooks/ThemeProvider';
import { ToastProvider } from './src/hooks/ToastProvider';
import { DeepLinkHandler } from './src/hooks/useDeepLinks';
import { useAndroidBack } from './src/hooks/useAndroidBack';
import { DownloadsProvider } from './src/hooks/useDownloads';
import { LibraryProvider } from './src/hooks/useLibrary';
import { NavigationProvider, useNavigation, type AppTab } from './src/hooks/useNavigation';
import i18n from './src/i18n';
import { GoalCompletedToast } from './src/components/GoalCompletedToast';
import { AuthScreen } from './src/screens/AuthScreen';
import { BookDetailsScreen } from './src/screens/BookDetailsScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InfoScreen } from './src/screens/InfoScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';

const TABS: { id: AppTab; labelKey: string; icon: IconName; iconActive: IconName }[] = [
  { id: 'home', labelKey: 'nav.home', icon: 'home-outline', iconActive: 'home' },
  { id: 'catalog', labelKey: 'nav.books', icon: 'book-outline', iconActive: 'book' },
  { id: 'library', labelKey: 'nav.library', icon: 'library-outline', iconActive: 'library' },
  { id: 'more', labelKey: 'more.tab', icon: 'ellipsis-horizontal-outline', iconActive: 'ellipsis-horizontal' },
];

function CurrentScreen() {
  const { tab, detailBook, infoPage } = useNavigation();

  if (detailBook) return <BookDetailsScreen />;
  if (infoPage === 'contact') return <ContactScreen />;
  if (infoPage) return <InfoScreen page={infoPage} />;
  if (tab === 'home') return <HomeScreen />;
  if (tab === 'catalog') return <CatalogScreen />;
  if (tab === 'library') return <LibraryScreen />;
  return <MoreScreen />;
}

function Shell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { recoveryPending } = useAuth();
  const { tab, setTab, authOpen, openAuth, readerBook } = useNavigation();
  useAndroidBack();

  useEffect(() => {
    if (recoveryPending) openAuth();
  }, [openAuth, recoveryPending]);

  if (authOpen || recoveryPending) {
    return <AuthScreen />;
  }

  if (readerBook) {
    return <ReaderScreen />;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.body}>
        <View style={styles.stage}>
          <CurrentScreen />
        </View>
      </View>
      <View
        style={[
          styles.tabs,
          { borderTopColor: colors.line, backgroundColor: colors.surface, paddingBottom: insets.bottom },
        ]}
      >
        <View style={[styles.tabsInner, isWide && { maxWidth: TAB_MAX }]}>
          {TABS.map((item) => {
            const active = tab === item.id;
            const color = active ? colors.ink : colors.muted;
            return (
              <Pressable key={item.id} style={styles.tab} onPress={() => setTab(item.id)}>
                <Icon name={active ? item.iconActive : item.icon} size={20} color={color} />
                <Text style={active ? [styles.tabActive, { color }] : [styles.tabIdle, { color }]}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safe, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <Shell />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NavigationProvider>
                <LibraryProvider>
                  <DownloadsProvider>
                    <DeepLinkHandler />
                    <ThemedApp />
                    <GoalCompletedToast />
                  </DownloadsProvider>
                </LibraryProvider>
              </NavigationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
    maxWidth: STAGE_MAX,
  },
  tabs: {
    borderTopWidth: 1,
    alignItems: 'center',
  },
  tabsInner: {
    flexDirection: 'row',
    width: '100%',
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 6,
  },
  tabActive: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabIdle: {
    fontSize: 11,
    fontWeight: '600',
  },
});
