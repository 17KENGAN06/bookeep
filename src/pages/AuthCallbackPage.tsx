import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthSpinner } from '@/components/auth/GoogleButton';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { getSupabaseClient } from '@/services/supabase';
import { takeAuthNext } from '@/utils/auth';

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      navigate('/login', { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError(true);
      return;
    }

    const next = takeAuthNext();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate(next, { replace: true });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        navigate(next, { replace: true });
      }
    });

    const timeout = window.setTimeout(() => {
      if (active) setError(true);
    }, 10000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <DocumentTitle title={t('auth.callback')} noindex />
      {error ? (
        <p className="max-w-md text-sm text-muted">
          {t('auth.callbackError')}{' '}
          <Link to="/login" className="font-semibold text-ink hover:text-accent">
            {t('auth.loginSubmit')}
          </Link>
        </p>
      ) : (
        <>
          <AuthSpinner />
          <p className="mt-4 text-sm text-muted">{t('auth.callback')}</p>
        </>
      )}
    </div>
  );
}
