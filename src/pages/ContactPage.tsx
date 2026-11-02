import { useState, type FormEvent, type ReactNode } from 'react';
import { LifeBuoy, Mail, Send, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Field, fieldControlClass } from '@/components/common/Field';
import { Reveal } from '@/components/common/Reveal';
import { PageHero } from '@/components/scene/PageHero';
import { useToast } from '@/components/common/Toast';
import { ADMIN_EMAIL, CONTACT_EMAIL, CONTACT_TOPICS, emailForTopic, type ContactTopic } from '@/config/contact';
import { sendContactMessage } from '@/services/contact';
import { cn } from '@/utils/cn';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 10;

type FieldErrors = Partial<Record<'name' | 'email' | 'message' | 'consent', string>>;

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
  const [triedSubmit, setTriedSubmit] = useState(false);
  const destination = emailForTopic(form.topic);
  const messageLength = form.message.trim().length;
  const messageLeft = Math.max(0, MIN_MESSAGE - messageLength);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = t('contact.form.errors.name');
    if (!EMAIL_RE.test(form.email.trim())) errors.email = t('contact.form.errors.email');
    if (messageLength < MIN_MESSAGE) {
      errors.message = t('contact.form.errors.message', { min: MIN_MESSAGE, left: messageLeft });
    }
    if (!form.consent) errors.consent = t('contact.form.errors.consent');
    return errors;
  }

  const errors = triedSubmit ? validate() : {};

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.company.trim()) return;
    const found = validate();
    const first = Object.values(found)[0];
    if (first) {
      setTriedSubmit(true);
      notify(first, 'error');
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
      setTriedSubmit(false);
      notify(t('contact.form.success'));
    } catch (error) {
      console.warn('[contact] send failed:', error);
      notify(t('contact.form.error', { email: destination }), 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <DocumentTitle title={t('contact.title')} description={t('contact.lead')} />
      <PageHero scene="botanical" eyebrow={t('contact.eyebrow')} title={t('contact.title')} lead={t('contact.lead')} />

      <Container>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-28 lg:grid-cols-1">
            <EmailCard
              icon={<LifeBuoy className="h-5 w-5" />}
              title={t('contact.channels.support.title')}
              text={t('contact.channels.support.text')}
              email={CONTACT_EMAIL}
            />
            <EmailCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t('contact.channels.admin.title')}
              text={t('contact.channels.admin.text')}
              email={ADMIN_EMAIL}
            />
          </div>

          <Reveal delay={120}>
          <form className="lux-panel space-y-5 rounded-[2rem] p-5 sm:p-8 lg:p-10" onSubmit={(event) => void onSubmit(event)} noValidate>
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

            <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('contact.form.name')} error={errors.name}>
              <input
                className={fieldControlClass}
                name="name"
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </Field>

            <Field label={t('contact.form.email')} error={errors.email}>
              <input
                className={fieldControlClass}
                type="email"
                name="email"
                autoComplete="email"
                aria-invalid={errors.email ? true : undefined}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </Field>
            </div>

            <Field
              label={t('contact.form.message')}
              error={errors.message}
              hint={
                messageLeft > 0
                  ? t('contact.form.messageHint', { min: MIN_MESSAGE, left: messageLeft })
                  : t('contact.form.messageOk', { count: messageLength })
              }
            >
              <textarea
                className={cn(fieldControlClass, 'min-h-36 resize-y')}
                name="message"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                required
                minLength={MIN_MESSAGE}
                aria-invalid={errors.message ? true : undefined}
              />
            </Field>

            <label className={cn('flex items-start gap-3 text-sm leading-relaxed', errors.consent ? 'text-danger' : 'text-muted')}>
              <input
                type="checkbox"
                className="check mt-0.5"
                checked={form.consent}
                onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
                required
              />
              <span>
                <Trans
                  i18nKey="contact.form.consent"
                  components={{
                    privacy: (
                      <Link to="/privacy" className="text-link" />
                    ),
                  }}
                />
              </span>
            </label>

            <Button type="submit" isLoading={sending} loadingText={t('contact.form.sending')} className="w-full sm:w-auto">
              <Send className="h-4 w-4" aria-hidden />
              {t('contact.form.submit')}
            </Button>
          </form>
          </Reveal>
        </div>
      </Container>
    </>
  );
}

function EmailCard({ icon, title, text, email }: { icon: ReactNode; title: string; text: string; email: string }) {
  return (
    <Reveal>
      <div className="lux-card lift h-full rounded-[1.5rem] p-6">
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
          {icon}
        </span>
        <h2 className="mt-5 font-display text-xl font-medium text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
        <a href={`mailto:${email}`} className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md text-sm font-semibold break-all text-accent hover:text-ink">
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          {email}
        </a>
      </div>
    </Reveal>
  );
}
