import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoalComposer } from '@/components/goals/GoalComposer';
import { GoalsCalendar } from '@/components/goals/GoalsCalendar';
import { Button } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import type { DayReadingState } from '@/types/reading';
import { dateISO, localDateISO, monthRange, monthTitle, shiftMonth } from '@/utils/dates';

function pickDefaultDate(year: number, month: number, today: string) {
  const { start, end } = monthRange(year, month);
  if (today >= start && today <= end) return today;
  return dateISO(year, month, 1);
}

function dayStateFor(date: string, days: DayReadingState[]): DayReadingState {
  return days.find((day) => day.date === date) ?? {
    date,
    pagesRead: 0,
    targetPages: null,
    completed: false,
  };
}

export function ReadingGoalsPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const now = new Date();
  const today = localDateISO();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => pickDefaultDate(now.getFullYear(), now.getMonth(), today));
  const { days, summary, status, reload, saveGoal, removeGoal } = useReadingGoals(year, month);
  const selected = dayStateFor(selectedDate, days);
  const { start, end } = useMemo(() => monthRange(year, month), [month, year]);

  const years = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 7 }, (_, index) => current - 3 + index);
  }, [now]);

  useEffect(() => {
    setSelectedDate(pickDefaultDate(year, month, today));
  }, [month, today, year]);

  function move(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }

  function onPickDate(date: string) {
    if (date < start || date > end) return;
    setSelectedDate(date);
  }

  function scrollToComposer() {
    document.getElementById('goal-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (isLoading) return <div className="min-h-[40vh]" />;
  if (!user) return <Navigate to="/login?next=/goals" replace />;

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

      <p className="font-display mt-8 text-lg font-semibold text-ink sm:text-xl">{monthTitle(year, month, i18n.resolvedLanguage ?? 'en')}</p>
      <p className="mt-2 text-sm text-muted">{t('goals.calendarHint')}</p>
      <Button type="button" className="mt-4 lg:hidden" onClick={scrollToComposer}>
        {t('goals.openComposer')}
      </Button>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label={t('goals.readingDays')} value={String(summary.readingDays)} />
        <SummaryCard label={t('goals.pagesRead')} value={String(summary.pagesRead)} />
        <SummaryCard label={t('goals.goalsCompleted')} value={`${summary.goalsCompleted} / ${summary.goalsSet}`} />
        <SummaryCard label={t('goals.currentStreak')} value={t('goals.streakValue', { count: summary.streak })} />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.75fr)]">
        <div className="order-2 rounded-3xl border border-line bg-surface p-3 sm:p-5 lg:order-1">
          {status === 'loading' ? (
            <Skeleton className="h-[28rem] w-full rounded-3xl" />
          ) : status === 'error' ? (
            <ErrorState onRetry={() => void reload()} />
          ) : (
            <GoalsCalendar
              year={year}
              month={month}
              today={today}
              selectedDate={selectedDate}
              days={days}
              onSelect={(day) => {
                setSelectedDate(day.date);
                if (window.matchMedia('(max-width: 1023px)').matches) scrollToComposer();
              }}
            />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <GoalComposer
            date={selected.date}
            minDate={start}
            maxDate={end}
            pagesRead={selected.pagesRead}
            targetPages={selected.targetPages}
            onDateChange={onPickDate}
            onSave={(target) => saveGoal(selected.date, target)}
            onDelete={() => removeGoal(selected.date)}
          />
        </div>
      </div>
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
