import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { PreferencesBar } from '../components/PreferencesBar';
import { useAuth } from '../hooks/AuthProvider';
import { FORM_MAX, useLayout } from '../hooks/useLayout';
import { useTheme } from '../hooks/ThemeProvider';
import { useNavigation } from '../hooks/useNavigation';
import { authRedirectTo } from '../services/auth';

export function AuthScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    signOut,
    isConfigured,
    user,
    recoveryPending,
  } = useAuth();
  const { closeAuth, setTab } = useNavigation();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function afterSignIn() {
    closeAuth();
    setTab('library');
  }

  async function onSubmit() {
    setError(null);
    setInfo(null);
    if (recoveryPending) {
      if (password.length < 6) {
        setError(t('auth.passwordHint'));
        return;
      }
      setBusy(true);
      try {
        await updatePassword(password);
        afterSignIn();
      } catch {
        setError(t('auth.newPasswordError'));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (mode === 'forgot') {
      if (!email.trim()) {
        setError(t('auth.forgotNeedEmail'));
        return;
      }
      setBusy(true);
      try {
        await resetPassword(email);
        setInfo(t('auth.forgotSent'));
      } catch {
        setError(t('auth.forgotError'));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordHint'));
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        afterSignIn();
      } else {
        const result = await signUp(email, password);
        if (result.needsConfirmation) setInfo(t('auth.checkEmail'));
        else afterSignIn();
      }
    } catch {
      setError(mode === 'login' ? t('auth.loginError') : t('auth.registerError'));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) afterSignIn();
    } catch {
      setError(t('auth.googleError'));
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword() {
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError(t('auth.passwordHint'));
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setPassword('');
      setInfo(t('auth.newPasswordDone'));
    } catch {
      setError(t('auth.newPasswordError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
          isWide && { maxWidth: FORM_MAX, width: '100%', alignSelf: 'center' },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <Pressable onPress={closeAuth} hitSlop={8} style={styles.backRow}>
        <Icon name="chevron-back" size={20} color={colors.accent} />
        <Text style={[styles.back, { color: colors.accent }]}>{t('reader.back')}</Text>
      </Pressable>
      {recoveryPending ? (
        <>
          <Text style={[styles.title, { color: colors.ink }]}>{t('auth.newPasswordTitle')}</Text>
          <Text style={[styles.lead, { color: colors.muted }]}>{t('auth.newPasswordLead')}</Text>
          <TextInput
            secureTextEntry
            autoComplete="new-password"
            placeholder={t('auth.password')}
            placeholderTextColor={colors.placeholder}
            style={[
              styles.input,
              { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink },
            ]}
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          <Pressable style={[styles.primary, { backgroundColor: colors.accent }]} onPress={() => void onSubmit()} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t('auth.newPasswordSubmit')}</Text>
            )}
          </Pressable>
        </>
      ) : user ? (
        <>
          <Text style={[styles.title, { color: colors.ink }]}>{t('auth.account')}</Text>
          <Text style={[styles.lead, { color: colors.muted }]}>{user.email}</Text>
          <PreferencesBar />
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('auth.changePassword')}</Text>
          <TextInput
            secureTextEntry
            autoComplete="new-password"
            placeholder={t('auth.password')}
            placeholderTextColor={colors.placeholder}
            style={[
              styles.input,
              { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink },
            ]}
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          {info ? <Text style={[styles.info, { color: colors.accent }]}>{info}</Text> : null}
          <Pressable
            style={[styles.secondary, { borderColor: colors.line, backgroundColor: colors.surface }]}
            onPress={() => void onChangePassword()}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.secondaryText, { color: colors.ink }]}>{t('auth.newPasswordSubmit')}</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.primary, { backgroundColor: colors.accent }]}
            onPress={() => {
              void signOut();
              closeAuth();
            }}
          >
            <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t('auth.signOut')}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.ink }]}>
            {mode === 'forgot' ? t('auth.forgotTitle') : mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </Text>
          <Text style={[styles.lead, { color: colors.muted }]}>
            {mode === 'forgot' ? t('auth.forgotLead') : mode === 'login' ? t('auth.loginLead') : t('auth.registerLead')}
          </Text>
          <PreferencesBar />
          {!isConfigured ? (
            <Text style={[styles.error, { color: colors.error }]}>{t('auth.notConfigured')}</Text>
          ) : (
            <>
              {mode !== 'forgot' ? (
                <>
                  <Pressable
                    style={[styles.google, { borderColor: colors.line, backgroundColor: colors.surface }]}
                    onPress={() => void onGoogle()}
                    disabled={busy}
                  >
                    <Text style={[styles.googleText, { color: colors.ink }]}>{t('auth.google')}</Text>
                  </Pressable>
                  {__DEV__ ? (
                    <Text selectable style={[styles.debug, { color: colors.placeholder }]}>
                      {authRedirectTo()}
                    </Text>
                  ) : null}
                  <Text style={[styles.or, { color: colors.placeholder }]}>{t('auth.or')}</Text>
                </>
              ) : null}
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder={t('auth.email')}
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink },
                ]}
                value={email}
                onChangeText={setEmail}
              />
              {mode !== 'forgot' ? (
                <TextInput
                  secureTextEntry
                  autoComplete={mode === 'login' ? 'password' : 'new-password'}
                  placeholder={t('auth.password')}
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.input,
                    { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                />
              ) : null}
              {mode === 'login' ? (
                <Pressable
                  onPress={() => {
                    setMode('forgot');
                    setError(null);
                    setInfo(null);
                  }}
                >
                  <Text style={[styles.forgot, { color: colors.muted }]}>{t('auth.forgotPassword')}</Text>
                </Pressable>
              ) : null}
              {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
              {info ? <Text style={[styles.info, { color: colors.accent }]}>{info}</Text> : null}
              <Pressable style={[styles.primary, { backgroundColor: colors.accent }]} onPress={() => void onSubmit()} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <Text style={[styles.primaryText, { color: colors.onAccent }]}>
                    {mode === 'forgot' ? t('auth.forgotSubmit') : mode === 'login' ? t('auth.loginSubmit') : t('auth.registerSubmit')}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setMode(mode === 'register' ? 'login' : mode === 'forgot' ? 'login' : 'register');
                  setError(null);
                  setInfo(null);
                }}
              >
                <Text style={[styles.switch, { color: colors.ink }]}>
                  {mode === 'login'
                    ? `${t('auth.noAccount')} ${t('auth.registerLink')}`
                    : mode === 'forgot'
                      ? t('auth.loginLink')
                      : `${t('auth.hasAccount')} ${t('auth.loginLink')}`}
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 20,
  },
  back: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  lead: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
  },
  google: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  debug: {
    marginTop: 8,
    fontSize: 11,
    textAlign: 'center',
  },
  or: {
    textAlign: 'center',
    marginVertical: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  error: {
    marginBottom: 10,
    fontSize: 14,
  },
  info: {
    marginBottom: 10,
    fontSize: 14,
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  switch: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  forgot: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});
