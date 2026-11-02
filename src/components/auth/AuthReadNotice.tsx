import { BookOpen, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Shown on log-in / sign-up when a guest pressed "Read": why the account, and that we bring them back. */
export function AuthReadNotice() {
  const { t } = useTranslation();
  return (
    <div className="auth-read-notice mt-6" role="status">
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <BookOpen className="h-4 w-4" />
      </span>
      <p className="min-w-0 text-sm leading-relaxed text-ink">{t('auth.readNotice')}</p>
    </div>
  );
}

const perks = ['demo', 'progress', 'trial'] as const;

/** What a free account gives: under the sign-up title. */
export function AuthPerks() {
  const { t } = useTranslation();
  return (
    <ul className="mt-6 grid gap-2.5">
      {perks.map((key) => (
        <li key={key} className="flex items-start gap-3 text-sm leading-snug text-ink">
          <span aria-hidden className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Check className="h-3 w-3" strokeWidth={2.6} />
          </span>
          {t(`auth.perks.${key}`)}
        </li>
      ))}
    </ul>
  );
}
