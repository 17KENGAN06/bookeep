import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthDivider, GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/common/Button';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Field, fieldControlClass } from '@/components/common/Field';
import { useAuth } from '@/hooks/useAuth';
import { safeNextPath, setAuthNext } from '@/utils/auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle, user, isLoading, isConfigured } = useAuth();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return <div className="min-h-[40vh]" />;
  }

  if (user) {
    return <Navigate to={next} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setAuthNext(next);
    try {
      await signInWithGoogle();
    } catch {
      setError(t('auth.googleError'));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[30rem] px-4 py-10 sm:py-16">
      <div className="lux-panel rounded-[2rem] px-5 py-8 sm:px-9 sm:py-10">
      <DocumentTitle title={t('auth.loginTitle')} noindex />
      <span aria-hidden className="mb-6 block h-px w-10 bg-gold/70" />
      <h1 className="font-display text-[2rem] leading-tight font-medium tracking-tight text-ink sm:text-[2.4rem]">{t('auth.loginTitle')}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">{t('auth.loginLead')}</p>

      {!isConfigured ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-muted">
          {t('auth.notConfigured')}
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          <GoogleButton onClick={() => void onGoogle()} disabled={submitting} />
          <AuthDivider />
          <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
            <Field label={t('auth.email')}>
              <input
                type="email"
                autoComplete="email"
                required
                className={fieldControlClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={t('auth.password')}>
              <input
                type="password"
                autoComplete="current-password"
                required
                className={fieldControlClass}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {error ? <p role="alert" className="text-sm font-medium text-[#c4674f] dark:text-[#e79a84]">{error}</p> : null}
            <Button type="submit" className="w-full" isLoading={submitting}>
              {t('auth.loginSubmit')}
            </Button>
          </form>
          <p className="text-sm text-muted">
            {t('auth.noAccount')}{' '}
            <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-ink underline decoration-gold/50 underline-offset-4 hover:text-gold">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
