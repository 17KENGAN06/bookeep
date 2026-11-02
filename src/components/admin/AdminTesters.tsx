import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';
import { forgetBookAccess } from '@/hooks/useBookAccess';
import { fetchAdminUsers, setTester, type AdminUser } from '@/services/adminUsers';

const ACTIVE = new Set(['trialing', 'active', 'past_due']);

type LoadState = 'loading' | 'success' | 'error';

/** Users panel: an admin marks accounts as testers, who then read like subscribers. */
export function AdminTesters() {
  const { t, i18n } = useTranslation();
  const { notify } = useToast();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (value: string) => {
    setStatus('loading');
    try {
      setUsers(await fetchAdminUsers(value));
      setStatus('success');
    } catch (error) {
      console.error('Users list failed', error);
      setStatus('error');
    }
  }, []);

  // Wait for a pause in typing before asking the database.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void load(search);
  }, [load, search]);

  async function toggle(target: AdminUser) {
    const enabled = !target.is_tester;
    setBusy(target.id);
    try {
      await setTester(target.id, enabled);
      setUsers((list) => list.map((item) => (item.id === target.id ? { ...item, is_tester: enabled } : item)));
      if (target.id === user?.id) forgetBookAccess();
      notify(enabled ? t('admin.testers.granted', { email: target.email ?? '' }) : t('admin.testers.revoked', { email: target.email ?? '' }));
    } catch (error) {
      console.error('Tester change failed', error);
      notify(t('admin.testers.error'), 'error');
    } finally {
      setBusy(null);
    }
  }

  const testers = users.filter((item) => item.is_tester).length;
  const dateOf = (value: string | null) => (value ? new Date(value).toLocaleDateString(i18n.resolvedLanguage) : '—');

  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{t('admin.testers.title')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t('admin.testers.lead')}</p>
        </div>
        {status === 'success' ? (
          <p className="text-sm text-muted">{t('admin.testers.count', { count: testers })}</p>
        ) : null}
      </div>

      <label className="relative mt-5 block max-w-md">
        <span className="sr-only">{t('admin.testers.search')}</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('admin.testers.search')}
          className="focus-ring w-full rounded-xl border border-line bg-bg py-2.5 pr-3 pl-9 text-sm text-ink"
        />
      </label>

      <div className="mt-5">
        {status === 'error' ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>{t('admin.testers.loadError')}</span>
            <Button type="button" variant="secondary" className="min-h-10 px-3 text-xs" onClick={() => void load(search)}>
              {t('admin.testers.retry')}
            </Button>
          </div>
        ) : status === 'loading' && users.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.testers.loading')}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted">{t('admin.testers.empty')}</p>
        ) : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
            {users.map((item) => {
              const paid = item.subscription_status ? ACTIVE.has(item.subscription_status) : false;
              return (
                <li key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {item.email ?? item.id}
                      {item.id === user?.id ? <span className="ml-2 text-xs text-muted">({t('admin.testers.you')})</span> : null}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {item.is_admin ? <span className="pill pill-accent">{t('admin.testers.badgeAdmin')}</span> : null}
                      {item.is_tester ? <span className="pill pill-accent">{t('admin.testers.badgeTester')}</span> : null}
                      {paid ? <span className="pill">{t('admin.testers.badgePaid')}</span> : null}
                      <span>{t('admin.testers.registered', { date: dateOf(item.created_at) })}</span>
                    </div>
                  </div>
                  {item.is_admin && !item.is_tester ? (
                    <p className="text-xs text-muted sm:max-w-[14rem] sm:text-right">{t('admin.testers.adminAlways')}</p>
                  ) : (
                    <Button
                      type="button"
                      variant={item.is_tester ? 'secondary' : 'primary'}
                      className="min-h-10 shrink-0 px-4 text-xs"
                      isLoading={busy === item.id}
                      disabled={Boolean(busy) && busy !== item.id}
                      onClick={() => void toggle(item)}
                    >
                      {item.is_tester ? t('admin.testers.revoke') : t('admin.testers.grant')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
