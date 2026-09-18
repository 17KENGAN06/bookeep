import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { ADMIN_EMAIL, CONTACT_TOPICS, emailForTopic, PARTNER_EMAIL, type ContactTopic } from '../config/contact';
import { ARTICLE_MAX, useLayout } from '../hooks/useLayout';
import { useTheme } from '../hooks/ThemeProvider';
import { useNavigation } from '../hooks/useNavigation';
import { sendContactMessage } from '../services/contact';
import { stripCopyTags } from '../utils/copy';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useLayout();
  const { closeInfo, openInfo } = useNavigation();
  const [topic, setTopic] = useState<ContactTopic>('question');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function onSubmit() {
    setFeedback(null);
    if (!name.trim() || !EMAIL_RE.test(email.trim()) || message.trim().length < 10 || !consent) {
      setFeedback({ type: 'error', text: t('contact.form.invalid') });
      return;
    }

    setSending(true);
    try {
      await sendContactMessage({
        topic,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setName('');
      setEmail('');
      setMessage('');
      setConsent(false);
      setFeedback({ type: 'ok', text: t('contact.form.success') });
    } catch {
      setFeedback({ type: 'error', text: t('contact.form.error') });
    } finally {
      setSending(false);
    }
  }

  const inputStyle = [
    styles.input,
    { borderColor: colors.line, backgroundColor: colors.surface, color: colors.ink },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.wrap, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
          isWide && { maxWidth: ARTICLE_MAX, width: '100%', alignSelf: 'center' },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable onPress={closeInfo} hitSlop={8} style={styles.backRow}>
          <Icon name="chevron-back" size={20} color={colors.muted} />
          <Text style={[styles.back, { color: colors.muted }]}>{t('reader.back')}</Text>
        </Pressable>

        <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('contact.eyebrow')}</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{t('contact.title')}</Text>
        <Text style={[styles.lead, { color: colors.muted }]}>{t('contact.lead')}</Text>

        <View style={styles.cards}>
          <EmailCard
            title={t('contact.channels.partner.title')}
            text={t('contact.channels.partner.text')}
            email={PARTNER_EMAIL}
          />
          <EmailCard
            title={t('contact.channels.admin.title')}
            text={t('contact.channels.admin.text')}
            email={ADMIN_EMAIL}
          />
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>{t('contact.form.topic')}</Text>
        <View style={styles.topics}>
          {CONTACT_TOPICS.map((option) => {
            const active = topic === option;
            return (
              <Pressable
                key={option}
                onPress={() => setTopic(option)}
                style={[
                  styles.topic,
                  { borderColor: colors.line, backgroundColor: colors.surface },
                  active && { borderColor: colors.accent, backgroundColor: colors.accent },
                ]}
              >
                <Text style={[styles.topicText, { color: active ? colors.onAccent : colors.muted }]}>
                  {t(`contact.form.topics.${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {t('contact.form.topicHint', { email: emailForTopic(topic) })}
        </Text>

        <Text style={[styles.label, { color: colors.muted }]}>{t('contact.form.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoComplete="name"
          placeholderTextColor={colors.placeholder}
          style={inputStyle}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('contact.form.email')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholderTextColor={colors.placeholder}
          style={inputStyle}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('contact.form.message')}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.placeholder}
          style={[...inputStyle, styles.textarea]}
        />

        <Pressable style={styles.consent} onPress={() => setConsent((value) => !value)}>
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.line, backgroundColor: colors.surface },
              consent && { borderColor: colors.accent, backgroundColor: colors.accent },
            ]}
          >
            {consent ? <Text style={[styles.check, { color: colors.onAccent }]}>✓</Text> : null}
          </View>
          <Text style={[styles.consentText, { color: colors.muted }]}>
            {stripCopyTags(t('contact.form.consent'))}{' '}
            <Text style={{ color: colors.accent }} onPress={() => openInfo('privacy')}>
              {t('nav.privacy')}
            </Text>
          </Text>
        </Pressable>

        {feedback ? (
          <Text style={[styles.feedback, { color: feedback.type === 'ok' ? colors.accent : colors.error }]}>
            {feedback.text}
          </Text>
        ) : null}

        <Pressable
          style={[styles.primary, { backgroundColor: colors.accent }]}
          onPress={() => void onSubmit()}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t('contact.form.submit')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EmailCard({ title, text, email }: { title: string; text: string; email: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <Text style={[styles.cardTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.cardText, { color: colors.muted }]}>{text}</Text>
      <Text style={[styles.cardEmail, { color: colors.accent }]} onPress={() => void Linking.openURL(`mailto:${email}`)}>
        {email}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
  cards: {
    marginTop: 20,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  cardEmail: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topic: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicText: {
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  textarea: {
    minHeight: 132,
    paddingTop: 12,
  },
  consent: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 13,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  feedback: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  primary: {
    marginTop: 20,
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
