import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoalCompletedListener } from '@/hooks/goalCelebration';

export function GoalCompletedToast() {
  const { t } = useTranslation();
  const { detail, dismiss } = useGoalCompletedListener();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!detail) {
      setLeaving(false);
      return;
    }
    setLeaving(false);
    const hide = window.setTimeout(() => setLeaving(true), 3400);
    const gone = window.setTimeout(dismiss, 3800);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, [detail, dismiss]);

  if (!detail) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex justify-center px-4 sm:bottom-8">
      <div
        role="status"
        className={`goal-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-accent/35 bg-surface px-4 py-3 shadow-[var(--app-shadow)] ${leaving ? 'is-leaving' : ''}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <BookGoalMark />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink">{t('goals.completedToast')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('goals.completedToastHint', { pages: detail.pages, target: detail.target })}</p>
        </div>
      </div>
    </div>
  );
}

function BookGoalMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
      <path
        d="M7 6.5h10.2c2.4 0 4.3 1.8 4.3 4v12.2c0-.9-1.1-1.6-2.4-1.6H7V6.5Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M7 6.5h10.2c2.4 0 4.3 1.8 4.3 4v14c-1.4-1-3.2-1.4-4.8-1.4H7V6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7 6.5v16.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="23.2" cy="22.4" r="5.2" fill="currentColor" />
      <path
        d="M20.8 22.5 22.5 24.2 25.7 20.8"
        fill="none"
        stroke="var(--app-on-accent)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
