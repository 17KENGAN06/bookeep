import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Field, fieldControlClass } from '@/components/common/Field';
import { Reveal } from '@/components/common/Reveal';
import { useToast } from '@/components/common/Toast';
import { ADMIN_EMAIL, CONTACT_TOPICS, emailForTopic, PARTNER_EMAIL, type ContactTopic } from '@/config/contact';
import { sendContactMessage } from '@/services/contact';
import { cn } from '@/utils/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  topic: 'question' as ContactTopic,
  name: '',
  email: '',
  message: '',
  company: '',
  consent: false,
};

export function ContactPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const destination = emailForTopic(form.topic);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.company.trim()) return;
    if (!form.name.trim() || !EMAIL_RE.test(form.email.trim()) || form.message.trim().length < 10 || !form.consent) {
      notify(t('contact.form.invalid'), 'error');
      return;
    }

    setSending(true);
    try {
      await sendContactMessage({
        topic: form.topic,
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setForm(emptyForm);
      notify(t('contact.form.success'));
    } catch {
      notify(t('contact.form.error'), 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <Container className="py-12 sm:py-16">
      <DocumentTitle title={t('contact.title')} description={t('contact.lead')} />
      <div className="max-w-3xl">
        <Reveal>
          <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('contact.eyebrow')}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {t('contact.title')}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-lg leading-relaxed text-muted">{t('contact.lead')}</p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
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
        </div>

        <Reveal delay={280}>
          <form className="mt-12 space-y-5" onSubmit={(event) => void onSubmit(event)} noValidate>
            <Field label={t('contact.form.topic')} hint={t('contact.form.topicHint', { email: destination })}>
              <select
                className={fieldControlClass}
                value={form.topic}
                onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value as ContactTopic }))}
              >
                {CONTACT_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {t(`contact.form.topics.${topic}`)}
                  </option>
                ))}
              </select>
            </Field>

            <div className="hidden" hidden aria-hidden="true">
              <label>
                Company
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                />
              </label>
            </div>

            <Field label={t('contact.form.name')}>
              <input
                className={fieldControlClass}
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </Field>

            <Field label={t('contact.form.email')}>
              <input
                className={fieldControlClass}
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </Field>

            <Field label={t('contact.form.message')}>
              <textarea
                className={cn(fieldControlClass, 'min-h-36 resize-y')}
                name="message"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                required
                minLength={10}
              />
            </Field>

            <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-line accent-[var(--app-accent)]"
                checked={form.consent}
                onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
                required
              />
              <span>
                <Trans
                  i18nKey="contact.form.consent"
                  components={{
                    privacy: (
                      <Link
                        to="/privacy"
                        className="font-semibold text-ink underline decoration-accent/50 underline-offset-4 hover:text-accent"
                      />
                    ),
                  }}
                />
              </span>
            </label>

            <Button type="submit" isLoading={sending} loadingText={t('contact.form.sending')} className="w-full sm:w-auto">
              {t('contact.form.submit')}
            </Button>
          </form>
        </Reveal>
      </div>
    </Container>
  );
}

function EmailCard({ title, text, email }: { title: string; text: string; email: string }) {
  return (
    <Reveal>
      <div className="h-full rounded-3xl border border-line bg-surface p-5 shadow-[var(--app-shadow)]">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
        <a
          href={`mailto:${email}`}
          className="focus-ring mt-4 inline-flex rounded-md text-sm font-semibold text-accent hover:text-accent-hover"
        >
          {email}
        </a>
      </div>
    </Reveal>
  );
}
