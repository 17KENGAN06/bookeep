import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Button } from '@/components/common/Button';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Field, fieldControlClass } from '@/components/common/Field';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function AdminLoginPage() {
  const { t } = useTranslation();
  const { signIn, signOut, user, isLoading, isConfigured, isAdmin, adminReady } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (isLoading || (user && !adminReady)) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (user && isAdmin) {
    return <Navigate to={from.startsWith('/admin') ? from : '/admin'} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError(t('admin.login.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <AmbientBackdrop />
      <DocumentTitle title={t('admin.login.title')} noindex />
      <div className="absolute top-4 right-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-[var(--app-shadow)] sm:p-8">
        <BrandLockup to="/" size="md" />
        <h1 className="font-display mt-6 text-2xl font-semibold text-ink">{t('admin.login.title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('admin.login.subtitle')}</p>

        {!isConfigured ? (
          <p className="mt-6 rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-muted">
            {t('admin.login.notConfigured')}
          </p>
        ) : user && !isAdmin ? (
          <div className="mt-6 space-y-4">
            <p role="alert" className="rounded-2xl border border-line bg-bg px-4 py-3 text-sm text-muted">
              {t('admin.login.forbidden')}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                void signOut();
              }}
            >
              {t('auth.signOut')}
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)}>
            <Field label={t('admin.login.email')}>
              <input
                type="email"
                autoComplete="username"
                required
                className={fieldControlClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={t('admin.login.password')}>
              <input
                type="password"
                autoComplete="current-password"
                required
                className={fieldControlClass}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {error ? <p role="alert" className="text-sm text-accent">{error}</p> : null}
            <Button type="submit" className="w-full" isLoading={submitting}>
              {t('admin.login.submit')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
