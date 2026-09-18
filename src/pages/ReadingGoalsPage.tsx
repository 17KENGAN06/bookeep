import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoalEditor } from '@/components/goals/GoalEditor';
import { GoalsCalendar } from '@/components/goals/GoalsCalendar';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import type { DayReadingState } from '@/types/reading';
import { monthTitle, shiftMonth } from '@/utils/dates';

export function ReadingGoalsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selected, setSelected] = useState<DayReadingState | null>(null);
  const { days, summary, status, reload, saveGoal, removeGoal, today } = useReadingGoals(year, month);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => current - 3 + index);
  }, []);

  function move(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }

  function onSelect(day: DayReadingState) {
    if (!user) {
      navigate('/login?next=/goals');
      return;
    }
    setSelected(day);
  }

  if (isLoading) return <div className="min-h-[40vh]" />;

  return (
    <Container className="py-10 sm:py-14">
      <DocumentTitle title={t('goals.title')} noindex />
      <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('goals.eyebrow')}</p>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl">{t('goals.title')}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{t('goals.lead')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="focus-ring rounded-xl border border-line bg-surface p-2 text-ink" onClick={() => move(-1)} aria-label={t('goals.prevMonth')}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <select
            className="focus-ring rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink"
            value={month}
            aria-label={t('goals.month')}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index}>
                {new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'en', { month: 'long' }).format(new Date(2024, index, 1))}
              </option>
            ))}
          </select>
          <select
            className="focus-ring rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink"
            value={year}
            aria-label={t('goals.year')}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button type="button" className="focus-ring rounded-xl border border-line bg-surface p-2 text-ink" onClick={() => move(1)} aria-label={t('goals.nextMonth')}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!user ? (
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">{t('goals.guestTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('goals.guestHint')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink to="/login?next=/goals">{t('auth.loginSubmit')}</ButtonLink>
            <ButtonLink to="/register?next=/goals" variant="secondary">
              {t('auth.registerSubmit')}
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <p className="font-display mt-8 text-lg font-semibold text-ink sm:text-xl">{monthTitle(year, month, i18n.resolvedLanguage ?? 'en')}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label={t('goals.readingDays')} value={String(summary.readingDays)} />
        <SummaryCard label={t('goals.pagesRead')} value={String(summary.pagesRead)} />
        <SummaryCard label={t('goals.goalsCompleted')} value={`${summary.goalsCompleted} / ${summary.goalsSet}`} />
        <SummaryCard label={t('goals.currentStreak')} value={t('goals.streakValue', { count: summary.streak })} />
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-surface p-3 sm:p-5">
        {status === 'loading' ? (
          <Skeleton className="h-[28rem] w-full rounded-3xl" />
        ) : status === 'error' ? (
          <ErrorState onRetry={() => void reload()} />
        ) : (
          <GoalsCalendar year={year} month={month} today={today} days={days} onSelect={onSelect} />
        )}
      </div>

      {user && selected ? (
        <GoalEditor
          key={selected.date}
          date={selected.date}
          pagesRead={selected.pagesRead}
          targetPages={selected.targetPages}
          onSave={(target) => saveGoal(selected.date, target)}
          onDelete={() => removeGoal(selected.date)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </Container>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
