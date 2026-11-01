import { useEffect, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';
import { useToast } from '@/components/common/Toast';
import { PageHero } from '@/components/scene/PageHero';
import { useAuth } from '@/hooks/useAuth';
import { forgetBookAccess } from '@/hooks/useBookAccess';
import { clearSignedPdfCache } from '@/services/access';
import {
  BillingError,
  fetchMySubscription,
  fetchPlan,
  formatPrice,
  openBillingPortal,
  startCheckout,
  type MySubscription,
  type Plan,
} from '@/services/billing';

const ACTIVE = new Set(['trialing', 'active', 'past_due']);
const FEATURES = ['catalog', 'translation', 'explanations', 'download'] as const;

// One day of grace, the same rule the database uses to open the books.
const GRACE_MS = 24 * 60 * 60 * 1000;

function isActive(sub: MySubscription | null) {
  if (!sub || !ACTIVE.has(sub.status)) return false;
  return !sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now() - GRACE_MS;
}

export function SubscribePage() {
  const { t, i18n } = useTranslation();
  const { notify } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const checkout = params.get('checkout');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sub, setSub] = useState<MySubscription | null>(null);
  const [subLoaded, setSubLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(checkout === 'success');
  const locale = i18n.resolvedLanguage ?? 'en';

  useEffect(() => {
    void fetchPlan().then(setPlan);
  }, []);

  // After Stripe Checkout the webhook may land a few seconds later: look again for a while.
  useEffect(() => {
    if (!user) {
      setSub(null);
      setSubLoaded(true);
      return;
    }
    let active = true;
    let tries = 0;
    let timer = 0;
    const load = () => {
      void fetchMySubscription(user.id)
        .then((next) => {
          if (!active) return;
          setSub(next);
          setSubLoaded(true);
          if (checkout === 'success') {
            if (isActive(next)) {
              forgetBookAccess();
              clearSignedPdfCache();
              setWaiting(false);
            } else if (tries < 15) {
              tries += 1;
              timer = window.setTimeout(load, 2000);
            } else {
              setWaiting(false);
            }
          }
        })
        .catch(() => {
          if (active) setSubLoaded(true);
        });
    };
    load();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [user, checkout]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      const code = error instanceof BillingError ? error.code : 'failed';
      notify(t(`subscribe.errors.${code}`), 'error');
      setBusy(false);
    }
  };

  const price = plan ? formatPrice(plan, locale) : null;
  const trialDays = plan?.trialDays ?? 3;
  const active = isActive(sub);
  const canTrial = !sub?.trial_used && trialDays > 0;
  const dateOf = (value: string | null) => (value ? new Date(value).toLocaleDateString(locale) : '');

  let status: string | null = null;
  if (active && sub) {
    if (sub.status === 'trialing') status = t('subscribe.status.trial', { date: dateOf(sub.trial_end ?? sub.current_period_end) });
    else if (sub.cancel_at_period_end) status = t('subscribe.status.ending', { date: dateOf(sub.current_period_end) });
    else if (sub.status === 'past_due') status = t('subscribe.status.pastDue');
    else if (sub.current_period_end) status = t('subscribe.status.active', { date: dateOf(sub.current_period_end) });
    else status = t('subscribe.status.manual');
  }

  let action;
  if (authLoading || (user && !subLoaded)) {
    action = <div className="h-14" />;
  } else if (!user) {
    action = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ButtonLink to="/register?next=/subscribe" className="w-full !min-h-14 sm:w-auto">
          {canTrial ? t('subscribe.startTrial', { count: trialDays }) : t('subscribe.cta')}
          <ButtonArrow />
        </ButtonLink>
        <Link to="/login?next=/subscribe" className="text-sm font-semibold text-muted hover:text-ink">
          {t('demo.haveAccount')}
        </Link>
      </div>
    );
  } else if (active) {
    action = sub?.stripe_customer_id ? (
      <Button variant="secondary" className="w-full !min-h-14 sm:w-auto" isLoading={busy} onClick={() => void run(openBillingPortal)}>
        {t('subscribe.manage')}
      </Button>
    ) : null;
  } else {
    action = (
      <Button className="w-full !min-h-14 sm:w-auto" isLoading={busy} onClick={() => void run(startCheckout)}>
        {canTrial ? t('subscribe.startTrial', { count: trialDays }) : t('subscribe.cta')}
        <ButtonArrow />
      </Button>
    );
  }

  return (
    <>
      <DocumentTitle title={t('subscribe.title')} description={t('subscribe.lead')} />
      <PageHero scene="library" eyebrow={t('subscribe.eyebrow')} title={t('subscribe.title')} lead={t('subscribe.lead')} />

      <Container className="pb-20">
        {checkout === 'success' ? (
          <div className="lux-card mb-8 rounded-2xl p-5" role="status">
            <p className="font-display text-lg text-ink">
              {waiting ? t('subscribe.checkoutWaiting') : active ? t('subscribe.checkoutDone') : t('subscribe.checkoutLate')}
            </p>
            {!waiting && active ? (
              <ButtonLink to="/books" variant="secondary" className="mt-4">
                {t('subscribe.toCatalog')}
              </ButtonLink>
            ) : null}
          </div>
        ) : null}
        {checkout === 'cancel' ? (
          <div className="lux-card mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5" role="status">
            <p className="text-sm text-muted">{t('subscribe.checkoutCanceled')}</p>
            <button type="button" className="text-sm font-semibold text-muted hover:text-ink" onClick={() => setParams({})}>
              {t('reader.explain.close')}
            </button>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Reveal>
            <article className="lux-panel rounded-[1.75rem] p-6 sm:p-9">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="pill pill-accent">{t('subscribe.planName')}</span>
                {canTrial && !active ? <span className="pill">{t('subscribe.trialBadge', { count: trialDays })}</span> : null}
              </div>
              {price ? (
                <p className="mt-6 font-display text-4xl font-medium text-ink sm:text-5xl">
                  {price}
                  <span className="ml-2 text-base text-muted">
                    {plan?.interval ? t(`subscribe.per.${plan.interval}`, { defaultValue: '' }) : ''}
                  </span>
                </p>
              ) : null}
              {status ? <p className="mt-4 text-sm font-semibold text-accent">{status}</p> : null}
              <ul className="mt-6 space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-3 text-[0.9375rem] text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {t(`subscribe.features.${feature}`)}
                  </li>
                ))}
              </ul>
              <div className="mt-8">{action}</div>
              {user && !active && sub?.stripe_customer_id && (sub.status === 'canceled' || sub.status === 'expired') ? (
                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-muted hover:text-ink"
                  disabled={busy}
                  onClick={() => void run(openBillingPortal)}
                >
                  {t('subscribe.history')}
                </button>
              ) : null}
              {!active && canTrial ? <p className="mt-3 text-xs text-faint">{t('subscribe.trialNote', { count: trialDays })}</p> : null}
            </article>
          </Reveal>

          <Reveal delay={100}>
            <article className="lux-card h-full rounded-[1.75rem] p-6 sm:p-9">
              <p className="pill">{t('subscribe.freeName')}</p>
              <ul className="mt-6 space-y-3 text-[0.9375rem] text-muted">
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('subscribe.free.demo')}
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('subscribe.free.explanations')}
                </li>
                <li className="flex gap-3">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('subscribe.free.noTranslation')}
                </li>
                <li className="flex gap-3">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t('subscribe.free.noDownload')}
                </li>
              </ul>
            </article>
          </Reveal>
        </div>
      </Container>
    </>
  );
}
