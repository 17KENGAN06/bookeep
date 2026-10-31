import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '@/components/auth/AuthShell';
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
    <AuthShell title={t('auth.loginTitle')} lead={t('auth.loginLead')}>
      <DocumentTitle title={t('auth.loginTitle')} noindex />
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
            {error ? <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">{error}</p> : null}
            <Button type="submit" className="w-full !min-h-[3.25rem]" isLoading={submitting}>
              {t('auth.loginSubmit')}
            </Button>
          </form>
          <p className="text-sm text-muted">
            {t('auth.noAccount')}{' '}
            <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-link">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
